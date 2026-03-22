import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";

const key = process.env.OPENROUTER_API_KEY;
if (!key || key === "sk-or-xxxxxxxxxxxxx" || key.length < 20) {
  throw new Error(
    "OPENROUTER_API_KEY is missing, is a placeholder, or is too short. " +
    "Set a valid API key in .env.local (get one at https://openrouter.ai/keys)"
  );
}

export const openrouter = createOpenRouter({
  apiKey: key,
});

export const SCOUT_MODEL = "anthropic/claude-sonnet-4.6" as const;
export const ARCHITECT_MODEL = "anthropic/claude-opus-4.6" as const;
export const ARCHITECT_FAST_MODEL = "anthropic/claude-sonnet-4.6" as const;
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

function extractProviderError(data: unknown): string | null {
  try {
    const d = data as Record<string, unknown>;
    const err = d?.error as Record<string, unknown> | undefined;
    const raw = (err?.metadata as Record<string, unknown>)?.raw;
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      return parsed?.error?.message ?? parsed?.message ?? null;
    }
  } catch { /* ignore parse errors */ }
  return null;
}

function logErrorDetails(error: unknown, attempt: number, maxRetries: number): void {
  const errAny = error as unknown as Record<string, unknown>;
  const details: string[] = [];

  if (error instanceof Error) {
    // Try to extract the real provider error from nested metadata
    const providerMsg = extractProviderError(errAny.data);
    details.push(`message: ${providerMsg ?? error.message}`);
    if (errAny.statusCode) details.push(`statusCode: ${errAny.statusCode}`);
    if (errAny.status) details.push(`status: ${errAny.status}`);
    if (errAny.cause) details.push(`cause: ${JSON.stringify(errAny.cause)}`);
    if (errAny.data && !providerMsg) details.push(`data: ${JSON.stringify(errAny.data)}`);
    if (errAny.responseBody) details.push(`responseBody: ${String(errAny.responseBody).slice(0, 500)}`);
  } else {
    details.push(`raw: ${String(error)}`);
  }

  console.warn(
    `[ai] Call failed (attempt ${attempt + 1}/${maxRetries + 1}) — ${details.join(" | ")}`
  );
}

/**
 * Race a promise against a timeout. If the timeout fires first, the original
 * promise keeps running but we reject immediately so the retry loop can proceed.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  if (ms <= 0) return promise;
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const DEFAULT_PER_ATTEMPT_TIMEOUT_MS = 240_000; // 4 minutes per attempt

export async function callAIWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  signal?: AbortSignal,
  timeoutMs: number = DEFAULT_PER_ATTEMPT_TIMEOUT_MS,
): Promise<T> {
  let lastError: Error | undefined;
  let effectiveMaxRetries = maxRetries;

  for (let attempt = 0; attempt <= effectiveMaxRetries; attempt++) {
    if (signal?.aborted) {
      throw signal.reason ?? new Error("Aborted");
    }
    try {
      const attemptStart = Date.now();
      console.log(`[ai] Attempt ${attempt + 1}/${effectiveMaxRetries + 1} starting...`);
      const result = await withTimeout(fn(), timeoutMs, "AI call");
      console.log(`[ai] Attempt ${attempt + 1} succeeded in ${((Date.now() - attemptStart) / 1000).toFixed(1)}s`);
      return result;
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

      // Model not found / invalid model errors — fail immediately
      if (
        lastError.message.includes("404") ||
        lastError.message.includes("not found") ||
        lastError.message.includes("does not exist") ||
        lastError.message.includes("invalid model")
      ) {
        throw new Error(
          `AI model not available: ${lastError.message}`
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
          // Normal backoff: 1s, 2s, 4s with up to 1s jitter
          delay = 1000 * Math.pow(2, attempt) + Math.random() * 1000;
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
 * Attempt to repair truncated JSON by closing open brackets/braces.
 * Returns the parsed object if successful, null otherwise.
 */
function tryRepairTruncatedJson(text: string): unknown {
  if (!text || typeof text !== "string") return null;

  // Strip any leading/trailing non-JSON text
  const firstBrace = text.indexOf("{");
  if (firstBrace === -1) return null;
  let json = text.slice(firstBrace);

  // Try parsing as-is first
  try {
    return JSON.parse(json);
  } catch { /* continue to repair */ }

  // Count open vs closed brackets/braces and close any remaining
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of json) {
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") openBraces++;
    else if (ch === "}") openBraces--;
    else if (ch === "[") openBrackets++;
    else if (ch === "]") openBrackets--;
  }

  // If we ended inside a string, close it
  if (inString) json += '"';

  // Trim any trailing incomplete key/value (e.g., `"key": "val` or `"key":`)
  // by removing back to the last complete value
  json = json.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, "");
  json = json.replace(/,\s*$/, "");

  // Close remaining brackets/braces
  for (let i = 0; i < openBrackets; i++) json += "]";
  for (let i = 0; i < openBraces; i++) json += "}";

  try {
    return JSON.parse(json);
  } catch { /* repair failed */ }

  return null;
}

/**
 * Extract the raw parsed JSON value from a generateObject error.
 * Handles two error types:
 *   1. AI_TypeValidationError — valid JSON with wrong field names → .value
 *   2. AI_JSONParseError — truncated/malformed JSON → .text (needs repair)
 */
export function extractRawValueFromError(error: unknown): unknown {
  if (!error || typeof error !== "object") return null;
  const err = error as Record<string, unknown>;

  if (err.cause && typeof err.cause === "object") {
    const cause = err.cause as Record<string, unknown>;

    // AI_TypeValidationError → has .value with the parsed JSON object
    if ("value" in cause && cause.value != null && typeof cause.value === "object") {
      return cause.value;
    }

    // AI_JSONParseError → has .text with the raw (possibly truncated) response
    if ("text" in cause && typeof cause.text === "string") {
      console.warn(`[ai] Attempting to repair truncated JSON from AI_JSONParseError (${cause.text.length} chars)`);
      const repaired = tryRepairTruncatedJson(cause.text);
      if (repaired) {
        console.warn(`[ai] Successfully repaired truncated JSON`);
        return repaired;
      }
    }
  }

  // Direct .value (some SDK versions)
  if ("value" in err && err.value != null && typeof err.value === "object") {
    return err.value;
  }

  // Direct .text (some SDK versions)
  if ("text" in err && typeof err.text === "string") {
    const repaired = tryRepairTruncatedJson(err.text);
    if (repaired) return repaired;
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
  model: string = SCOUT_MODEL,
  maxOutputTokens: number = 8192,
  timeoutMs: number = DEFAULT_PER_ATTEMPT_TIMEOUT_MS,
): Promise<T> {
  console.log(`[ai] callAIStructured: ${schemaName ?? "unknown"} via ${model} (maxTokens=${maxOutputTokens})`);
  return callAIWithRetry(async () => {
    try {
      const { object } = await generateObject({
        model: openrouter(model),
        mode: "json",
        schema,
        schemaName,
        schemaDescription,
        system: STRUCTURED_SYSTEM_MSG,
        prompt,
        maxOutputTokens,
        temperature: 0,
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
  }, 3, signal, timeoutMs);
}

// --- Token Profiling (Phase 3) ---

export interface TokenProfile {
  label: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  timestamp: string;
}

const tokenProfiles: TokenProfile[] = [];

export function recordTokenProfile(profile: TokenProfile) {
  tokenProfiles.push(profile);
  console.log(`[ai:tokens] ${profile.label}: ${profile.inputTokens} in / ${profile.outputTokens} out (${(profile.durationMs / 1000).toFixed(1)}s) via ${profile.model}`);
}

export function getTokenProfiles(): TokenProfile[] {
  return [...tokenProfiles];
}

export function clearTokenProfiles() {
  tokenProfiles.length = 0;
}
