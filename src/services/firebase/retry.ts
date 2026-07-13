export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableCodes: string[];
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableCodes: [
    "unavailable",
    "deadline-exceeded",
    "network-error",
    "rate-limited",
    "resource-exhausted",
    "internal",
  ],
};

function calculateDelay(attempt: number, options: RetryOptions): number {
  const delay = Math.min(
    options.baseDelayMs * Math.pow(2, attempt),
    options.maxDelayMs,
  );
  const jitter = delay * (0.5 + Math.random() * 0.5);
  return Math.floor(jitter);
}

function isRetryable(error: { code?: string }, options: RetryOptions): boolean {
  if (!error.code) return false;
  return options.retryableCodes.includes(error.code);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const errorObj = err as { code?: string };
      if (attempt < opts.maxAttempts - 1 && isRetryable(errorObj, opts)) {
        const delay = calculateDelay(attempt, opts);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      break;
    }
  }

  throw lastError;
}
