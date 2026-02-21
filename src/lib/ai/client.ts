import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";

const key = process.env.OPENROUTER_API_KEY;
if (!key || key === "sk-or-xxxxxxxxxxxxx" || key.length < 20) {
  console.warn(
    "[ai] WARNING: OPENROUTER_API_KEY appears to be missing or is a placeholder"
  );
}

export const openrouter = createOpenRouter({
  apiKey: key,
});

export const MODEL = "anthropic/claude-sonnet-4" as const;
export const SENTIMENT_MODEL = "anthropic/claude-haiku-4-5" as const;

export const STRUCTURED_SYSTEM_MSG =
  "You are a structured data generator. Respond ONLY with valid JSON conforming to the provided schema. No markdown, no commentary, no extra text.";

export async function repairJsonText({
  text,
}: {
  text: string;
  error: unknown;
}): Promise<string | null> {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return null;
}

export function cancellableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error("Aborted"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason ?? new Error("Aborted"));
    }, { once: true });
  });
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("too many requests")) {
      return true;
    }
    // Check for statusCode property (Vercel AI SDK errors)
    const errAny = error as unknown as Record<string, unknown>;
    if (errAny.statusCode === 429 || errAny.status === 429) {
      return true;
    }
  }
  return false;
}

function logErrorDetails(error: unknown, attempt: number, maxRetries: number): void {
  const errAny = error as unknown as Record<string, unknown>;
  const details: string[] = [];

  if (error instanceof Error) {
    details.push(`message: ${error.message}`);
    if (errAny.statusCode) details.push(`statusCode: ${errAny.statusCode}`);
    if (errAny.status) details.push(`status: ${errAny.status}`);
    if (errAny.cause) details.push(`cause: ${JSON.stringify(errAny.cause)}`);
    if (errAny.data) details.push(`data: ${JSON.stringify(errAny.data)}`);
    if (errAny.responseBody) details.push(`responseBody: ${String(errAny.responseBody).slice(0, 500)}`);
  } else {
    details.push(`raw: ${String(error)}`);
  }

  console.warn(
    `[ai] Call failed (attempt ${attempt + 1}/${maxRetries + 1}) — ${details.join(" | ")}`
  );
}

export async function callAIWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  signal?: AbortSignal
): Promise<T> {
  let lastError: Error | undefined;
  let effectiveMaxRetries = maxRetries;

  for (let attempt = 0; attempt <= effectiveMaxRetries; attempt++) {
    if (signal?.aborted) {
      throw signal.reason ?? new Error("Aborted");
    }
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Log full error details
      logErrorDetails(error, attempt, effectiveMaxRetries);

      // Auth errors won't resolve with retries — fail immediately
      if (
        lastError.message.includes("auth") ||
        lastError.message.includes("credentials") ||
        lastError.message.includes("Unauthorized") ||
        lastError.message.includes("401")
      ) {
        throw new Error(
          `AI authentication failed — check your OPENROUTER_API_KEY in .env.local: ${lastError.message}`
        );
      }

      // Rate-limit errors: extend retries to 5 and use much longer backoff
      const rateLimited = isRateLimitError(error);
      if (rateLimited && effectiveMaxRetries < 5) {
        effectiveMaxRetries = 5;
        console.warn(`[ai] Rate limit detected — extending max retries to ${effectiveMaxRetries + 1} attempts`);
      }

      if (attempt < effectiveMaxRetries) {
        let delay: number;
        if (rateLimited) {
          // Rate-limit backoff: 30s, 60s, 120s, 240s, 480s
          delay = 30_000 * Math.pow(2, attempt) + Math.random() * 5_000;
          console.warn(`[ai] Rate-limited — waiting ${Math.round(delay / 1000)}s before retry`);
        } else {
          // Normal backoff: 2s, 4s, 8s with up to 2s jitter
          delay = 2000 * Math.pow(2, attempt) + Math.random() * 2000;
        }
        await cancellableDelay(delay, signal);
      }
    }
  }
  throw new Error(
    `AI call failed after ${effectiveMaxRetries + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Extract the raw parsed JSON value from a generateObject validation error.
 * When the AI returns valid JSON that doesn't match the Zod schema (wrong field
 * names), the SDK stores the parsed value inside the error chain:
 *   NoObjectGeneratedError.cause = AI_TypeValidationError { value: {...} }
 */
export function extractRawValueFromError(error: unknown): unknown {
  if (!error || typeof error !== "object") return null;
  const err = error as Record<string, unknown>;

  // NoObjectGeneratedError → cause is AI_TypeValidationError with .value
  if (err.cause && typeof err.cause === "object") {
    const cause = err.cause as Record<string, unknown>;
    if ("value" in cause && cause.value != null && typeof cause.value === "object") {
      return cause.value;
    }
  }

  // Direct .value (some SDK versions)
  if ("value" in err && err.value != null && typeof err.value === "object") {
    return err.value;
  }

  return null;
}

/**
 * Call AI with structured output (generateObject) + error-recovery pattern.
 * Shared by both Scout and Architect agents.
 */
export async function callAIStructured<T>(
  prompt: string,
  schema: z.ZodType<T>,
  schemaName?: string,
  schemaDescription?: string,
  signal?: AbortSignal,
  model: string = MODEL,
  maxOutputTokens: number = 16384,
): Promise<T> {
  return callAIWithRetry(async () => {
    try {
      const { object } = await generateObject({
        model: openrouter(model),
        schema,
        schemaName,
        schemaDescription,
        system: STRUCTURED_SYSTEM_MSG,
        prompt,
        maxOutputTokens,
        abortSignal: signal,
        experimental_repairText: repairJsonText,
      });
      return object;
    } catch (error) {
      // generateObject throws when Zod validation fails, but the raw parsed
      // JSON is embedded in the error chain. Since the data is immediately
      // JSON.stringify'd downstream, field name differences don't matter.
      const rawValue = extractRawValueFromError(error);
      if (rawValue) {
        console.warn(
          `[ai] generateObject schema validation failed — using raw AI JSON output`
        );
        return rawValue as T;
      }
      // No extractable value (e.g. network error, empty response) — rethrow for retry
      throw error;
    }
  }, 3, signal);
}
