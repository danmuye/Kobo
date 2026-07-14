import type { UploadResult } from "firebase/storage";
import { getFirebaseStorage, isConfigured, initializeFirebase, whenReady } from "./config";
import { toFirebaseServiceError, type FirebaseErrorCode } from "./errors";
import { withRetry } from "./retry";
import { getFirebaseStatus } from "./status";

const STORAGE_RETRYABLE_CODES: FirebaseErrorCode[] = [
  "network-error",
  "unavailable",
  "rate-limited",
  "deadline-exceeded",
  "internal",
];

function guardReady() {
  if (!isConfigured()) {
    throw toFirebaseServiceError({
      code: "unconfigured",
      message: "Firebase Storage is not configured.",
    });
  }
}

async function ensureStorageReady() {
  guardReady();
  const status = getFirebaseStatus();
  if (!status.isInitialized) {
    await initializeFirebase();
  }
  await whenReady();
  return getFirebaseStorage();
}

async function loadStorage(): Promise<typeof import("firebase/storage")> {
  return import("firebase/storage");
}

async function withErrorHandling<R>(fn: () => Promise<R>): Promise<R> {
  try {
    return await fn();
  } catch (err) {
    throw toFirebaseServiceError(err);
  }
}

export async function uploadFile(
  path: string,
  file: File,
): Promise<UploadResult> {
  const storage = await ensureStorageReady();
  const mod = await loadStorage();

  return withRetry(
    () => withErrorHandling(async () => {
      const storageRef = mod.ref(storage, path);
      return mod.uploadBytes(storageRef, file);
    }),
    { retryableCodes: STORAGE_RETRYABLE_CODES },
  );
}

export async function uploadBase64(
  path: string,
  base64: string,
): Promise<UploadResult> {
  const storage = await ensureStorageReady();
  const mod = await loadStorage();

  return withRetry(
    () => withErrorHandling(async () => {
      const storageRef = mod.ref(storage, path);
      return mod.uploadString(storageRef, base64);
    }),
    { retryableCodes: STORAGE_RETRYABLE_CODES },
  );
}

export async function getFileUrl(path: string): Promise<string> {
  const storage = await ensureStorageReady();
  const mod = await loadStorage();

  return withRetry(
    () => withErrorHandling(async () => {
      const storageRef = mod.ref(storage, path);
      return mod.getDownloadURL(storageRef);
    }),
    { retryableCodes: STORAGE_RETRYABLE_CODES },
  );
}

export async function deleteFile(path: string): Promise<void> {
  const storage = await ensureStorageReady();
  const mod = await loadStorage();

  return withRetry(
    () => withErrorHandling(async () => {
      const storageRef = mod.ref(storage, path);
      await mod.deleteObject(storageRef);
    }),
    { retryableCodes: STORAGE_RETRYABLE_CODES },
  );
}
