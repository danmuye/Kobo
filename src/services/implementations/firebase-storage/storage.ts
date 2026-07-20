import type { IStorageService, UploadResult } from "@/services/interfaces/storage";
import { getFirebaseStorage, isConfigured, initializeFirebase, whenReady } from "@/services/firebase/config";
import { toFirebaseServiceError, type FirebaseErrorCode } from "@/services/firebase/errors";
import { withRetry } from "@/services/firebase/retry";
import { getFirebaseStatus } from "@/services/firebase/status";

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

export class FirebaseStorageService implements IStorageService {
  async upload(file: File, path?: string): Promise<UploadResult> {
    const storage = await ensureStorageReady();
    const mod = await loadStorage();
    const resolvedPath = path ?? `uploads/${Date.now()}_${file.name}`;
    const storageRef = mod.ref(storage, resolvedPath);

    const result = await withRetry(
      async () => {
        const uploadResult = await mod.uploadBytes(storageRef, file);
        const url = await mod.getDownloadURL(uploadResult.ref);
        return {
          url,
          size: uploadResult.metadata.size,
        } as UploadResult;
      },
      { retryableCodes: STORAGE_RETRYABLE_CODES },
    );

    return result;
  }

  async delete(url: string): Promise<void> {
    const storage = await ensureStorageReady();
    const mod = await loadStorage();

    return withRetry(
      async () => {
        const storageRef = mod.ref(storage, url);
        await mod.deleteObject(storageRef);
      },
      { retryableCodes: STORAGE_RETRYABLE_CODES },
    );
  }

  async getUrl(path: string): Promise<string> {
    const storage = await ensureStorageReady();
    const mod = await loadStorage();

    return withRetry(
      async () => {
        const storageRef = mod.ref(storage, path);
        return mod.getDownloadURL(storageRef);
      },
      { retryableCodes: STORAGE_RETRYABLE_CODES },
    );
  }
}
