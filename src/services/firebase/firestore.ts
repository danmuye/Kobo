import type { Firestore, QueryConstraint, DocumentData, CollectionReference, DocumentReference } from "firebase/firestore";
import { getFirestoreDb, isConfigured, initializeFirebase, whenReady } from "./config";
import { toFirebaseServiceError, type FirebaseErrorCode } from "./errors";
import { withRetry } from "./retry";
import { getFirebaseStatus } from "./status";
import { useAuthStore } from "@/store/auth";
import { sanitizeFirestoreData } from "./sanitize";

const FIRESTORE_RETRYABLE_CODES: FirebaseErrorCode[] = [
  "unavailable",
  "deadline-exceeded",
  "network-error",
  "resource-exhausted",
  "internal",
];

function guardReady() {
  if (!isConfigured()) {
    throw toFirebaseServiceError({
      code: "unconfigured",
      message: "Firebase is not configured.",
    });
  }
}

async function ensureFirestoreReady(): Promise<Firestore> {
  guardReady();
  const status = getFirebaseStatus();
  if (!status.isInitialized) {
    await initializeFirebase();
  }
  await whenReady();
  return getFirestoreDb();
}

async function loadFirestore(): Promise<typeof import("firebase/firestore")> {
  return import("firebase/firestore");
}

export interface FirestoreCollection<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Omit<T, "id">): Promise<T>;
  set(id: string, data: T): Promise<void>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  query(constraints: QueryConstraint[]): Promise<T[]>;
  isOffline(): boolean;
}

export async function createCollection<T extends { id: string }>(
  collectionPath: string,
  db?: Firestore,
): Promise<FirestoreCollection<T>> {
  const firestore = db ?? (await ensureFirestoreReady());
  const fs = await loadFirestore();
  const colRef = fs.collection(firestore, collectionPath) as CollectionReference<T>;

  async function withErrorHandling<R>(
    fn: () => Promise<R>,
    context: Record<string, unknown> = {},
  ): Promise<R> {
    try {
      return await fn();
    } catch (err) {
      if (import.meta.env.DEV) {
        const uid = getCurrentUserId();
        console.group(`[Firestore] ${context.operation ?? "unknown"} failed`);
        console.error("Error:", err);
        if (err instanceof Error) {
          console.log("Error name:", err.name);
          console.log("Error message:", err.message);
          if ("code" in err) console.log("Error code:", (err as { code: unknown }).code);
        }
        console.log("Collection:", collectionPath);
        console.log("Operation:", context.operation ?? "unknown");
        if (context.docId) console.log("Document ID:", context.docId);
        if (context.dataSanitized !== undefined) console.log("Data written (sanitized):", context.dataSanitized);
        if (uid) console.log("User UID:", uid);
        console.log("Full context:", { ...context, dataSanitized: undefined });
        console.groupEnd();
      }
      throw toFirebaseServiceError(err);
    }
  }

  function getCurrentUserId(): string | null {
    try {
      return useAuthStore.getState().user?.uid ?? null;
    } catch {
      return null;
    }
  }

  function isOffline(): boolean {
    return !getFirebaseStatus().isOnline;
  }

  async function getAll(): Promise<T[]> {
    return withRetry(
      () => withErrorHandling(async () => {
        const snap = await fs.getDocs(colRef);
        return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as T[];
      }, { operation: "getAll" }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function getById(id: string): Promise<T | null> {
    return withRetry(
      () => withErrorHandling(async () => {
        const docRef = fs.doc(firestore, collectionPath, id) as DocumentReference<T>;
        const snap = await fs.getDoc(docRef);
        return snap.exists() ? ({ ...snap.data(), id: snap.id } as T) : null;
      }, { operation: "getById", docId: id }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function create(data: Omit<T, "id">): Promise<T> {
    return withRetry(
      () => withErrorHandling(async () => {
        const sanitized = sanitizeFirestoreData(data);
        const docRef = await fs.addDoc(colRef, sanitized as DocumentData);
        return { ...data, id: docRef.id } as T;
      }, {
        operation: "create",
        dataKeys: Object.keys(data as object),
        dataSize: JSON.stringify(data).length,
        dataSanitized: sanitizeFirestoreData(data),
      }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function set(id: string, data: T): Promise<void> {
    return withRetry(
      () => withErrorHandling(async () => {
        const sanitized = sanitizeFirestoreData(data);
        const docRef = fs.doc(firestore, collectionPath, id) as DocumentReference<T>;
        await fs.setDoc(docRef, sanitized as DocumentData);
      }, {
        operation: "set",
        docId: id,
        dataKeys: Object.keys(data as object),
        dataSize: JSON.stringify(data).length,
        dataSanitized: sanitizeFirestoreData(data),
      }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function update(id: string, data: Partial<T>): Promise<void> {
    return withRetry(
      () => withErrorHandling(async () => {
        const sanitized = sanitizeFirestoreData(data);
        const docRef = fs.doc(firestore, collectionPath, id) as DocumentReference<T>;
        await fs.updateDoc(docRef, sanitized as DocumentData);
      }, {
        operation: "update",
        docId: id,
        dataKeys: Object.keys(data as object),
        dataSize: JSON.stringify(data).length,
        dataSanitized: sanitizeFirestoreData(data),
      }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function delete_(id: string): Promise<void> {
    return withRetry(
      () => withErrorHandling(async () => {
        const docRef = fs.doc(firestore, collectionPath, id) as DocumentReference<T>;
        await fs.deleteDoc(docRef);
      }, { operation: "delete", docId: id }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function query_(constraints: QueryConstraint[]): Promise<T[]> {
    return withRetry(
      () => withErrorHandling(async () => {
        const q = fs.query(colRef, ...constraints);
        const snap = await fs.getDocs(q);
        return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as T[];
      }, {
        operation: "query",
        constraints: constraints.map((c) => c.toString()),
      }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  return { getAll, getById, create, set, update, delete: delete_, query: query_, isOffline };
}

export { type QueryConstraint };
export async function where(
  fieldPath: string,
  opStr: string,
  value: unknown,
): Promise<import("firebase/firestore").QueryConstraint> {
  const fs = await loadFirestore();
  return fs.where(fieldPath, opStr as any, value);
}
export async function orderBy(
  fieldPath: string,
  directionStr?: "asc" | "desc",
): Promise<import("firebase/firestore").QueryConstraint> {
  const fs = await loadFirestore();
  return fs.orderBy(fieldPath, directionStr);
}
export async function limit(
  limit_: number,
): Promise<import("firebase/firestore").QueryConstraint> {
  const fs = await loadFirestore();
  return fs.limit(limit_);
}
