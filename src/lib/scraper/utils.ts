/**
 * Retry wrapper with exponential backoff, jitter, and 429 detection.
 * On 429, uses longer delays (1000ms+). On regular failure, starts at 200ms.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const is429 = lastError.message.includes("429") || lastError.message.includes("rate limit");
        const baseDelay = is429
          ? Math.pow(2, attempt) * 1000  // 1s, 2s, 4s for rate limits
          : Math.pow(2, attempt) * 200;  // 200ms, 400ms, 800ms for other errors
        const jitter = Math.random() * 300;
        await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
      }
    }
  }
  throw lastError;
}
