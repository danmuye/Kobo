export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableCodes: string[];
}

const QUEUE_KEY = "firestore_write_queue";

interface QueuedWrite {
  id: string;
  collectionPath: string;
  operation: "create" | "set" | "update" | "delete";
  docId?: string;
  data?: unknown;
  createdAt: number;
  retries: number;
}

function loadQueue(): QueuedWrite[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedWrite[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch { /* ignore */ }
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

      if (import.meta.env.DEV) {
        const willRetry = attempt < opts.maxAttempts - 1 && isRetryable(errorObj, opts);
        console.warn(
          `[Firestore] Attempt ${attempt + 1}/${opts.maxAttempts} failed`,
          `code=${errorObj.code ?? "unknown"}`,
          willRetry ? `— retrying...` : `— giving up`,
        );
      }

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

export function getWriteQueue(): QueuedWrite[] {
  return loadQueue();
}

export function addToWriteQueue(write: Omit<QueuedWrite, "id" | "createdAt" | "retries">): void {
  const queue = loadQueue();
  queue.push({
    ...write,
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    createdAt: Date.now(),
    retries: 0,
  });
  saveQueue(queue);
}

export function removeFromWriteQueue(id: string): void {
  saveQueue(loadQueue().filter((w) => w.id !== id));
}

export async function retryQueuedWrites(): Promise<void> {
  const queue = loadQueue();
  if (queue.length === 0) return;

  const { getFirebaseStatus } = await import("./status");
  const status = getFirebaseStatus?.();
  if (!status?.isOnline || !status?.isInitialized) return;

  const { ensureFirestoreReady, loadFirestore, poolKey, collectionPool } = await import("./firestore");

  const remaining: QueuedWrite[] = [];

  for (const entry of queue) {
    try {
      const key = poolKey(entry.collectionPath);
      let col = collectionPool.get(key);
      if (!col) {
        const { createCollectionInternal } = await import("./firestore");
        col = createCollectionInternal(entry.collectionPath);
        collectionPool.set(key, col);
      }
      const fs = await loadFirestore();
      const firestore = await ensureFirestoreReady();

      switch (entry.operation) {
        case "create":
          (await col).create(entry.data as any);
          break;
        case "set":
          (await col).set(entry.docId!, entry.data as any);
          break;
        case "update":
          (await col).update(entry.docId!, entry.data as any);
          break;
        case "delete":
          (await col).delete(entry.docId!);
          break;
      }
    } catch {
      if (entry.retries < 10) {
        remaining.push({ ...entry, retries: entry.retries + 1 });
      }
    }
  }

  saveQueue(remaining);
}

export function setupRetryQueue(): () => void {
  const onOnline = () => {
    retryQueuedWrites();
  };
  window.addEventListener("online", onOnline);

  // also retry periodically every 30s while online
  const interval = setInterval(() => {
    retryQueuedWrites();
  }, 30000);

  return () => {
    window.removeEventListener("online", onOnline);
    clearInterval(interval);
  };
}
