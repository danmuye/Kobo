import type { Firestore, QueryConstraint, DocumentData, CollectionReference, DocumentReference } from "firebase/firestore";
import { getFirestoreDb, isConfigured, initializeFirebase, whenReady } from "./config";
import { toFirebaseServiceError, type FirebaseErrorCode } from "./errors";
import { withRetry, addToWriteQueue, removeFromWriteQueue, retryQueuedWrites } from "./retry";
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

// ── Collection pool: reuse cached collection references ────────────────────
const collectionPool = new Map<string, Promise<FirestoreCollection<any>>>();

function poolKey(path: string): string {
  return path;
}

export function clearPool(): void {
  collectionPool.clear();
}

// ── Internal collection creation (without pool) ────────────────────────────

async function createCollectionInternal<T extends { id: string }>(
  collectionPath: string,
): Promise<FirestoreCollection<T>> {
  const firestore = await ensureFirestoreReady();
  const fs = await loadFirestore();
  const colRef = fs.collection(firestore, collectionPath) as CollectionReference<T>;
  return buildCollection<T>(colRef, collectionPath, firestore, fs);
}

// ── Build collection interface ─────────────────────────────────────────────

function buildCollection<T extends { id: string }>(
  colRef: CollectionReference<T>,
  collectionPath: string,
  firestore: Firestore,
  fs: typeof import("firebase/firestore"),
): FirestoreCollection<T> {

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

  async function getAll(selectFields?: string[]): Promise<T[]> {
    return withRetry(
      () => withErrorHandling(async () => {
        let q = colRef;
        if (selectFields && selectFields.length > 0) {
          q = fs.query(colRef, ...selectFields.map((f) => fs.select(f as any))) as any;
        }
        const snap = await fs.getDocs(q);
        return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as T[];
      }, { operation: "getAll", fields: selectFields }),
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
    if (isOffline()) {
      addToWriteQueue({ collectionPath, operation: "create", data });
      const tempId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      return { ...data, id: tempId } as T;
    }
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
    if (isOffline()) {
      addToWriteQueue({ collectionPath, operation: "set", docId: id, data });
      return;
    }
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
    if (isOffline()) {
      addToWriteQueue({ collectionPath, operation: "update", docId: id, data });
      return;
    }
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
    if (isOffline()) {
      addToWriteQueue({ collectionPath, operation: "delete", docId: id });
      return;
    }
    return withRetry(
      () => withErrorHandling(async () => {
        const docRef = fs.doc(firestore, collectionPath, id) as DocumentReference<T>;
        await fs.deleteDoc(docRef);
      }, { operation: "delete", docId: id }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function query_(constraints: QueryConstraint[], selectFields?: string[]): Promise<T[]> {
    return withRetry(
      () => withErrorHandling(async () => {
        const allConstraints = [...constraints];
        if (selectFields && selectFields.length > 0) {
          allConstraints.push(...selectFields.map((f) => fs.select(f as any)));
        }
        const q = fs.query(colRef, ...allConstraints);
        const snap = await fs.getDocs(q);
        return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as T[];
      }, {
        operation: "query",
        constraints: constraints.map((c) => c.toString()),
        fields: selectFields,
      }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function listPage(
    pageSize: number,
    cursor?: { field: string; value: unknown; direction?: "asc" | "desc" },
  ): Promise<{ items: T[]; nextCursor: { field: string; value: unknown } | null }> {
    return withRetry(
      () => withErrorHandling(async () => {
        const constraints: QueryConstraint[] = [fs.limit(pageSize)];
        if (cursor) {
          const dir = cursor.direction ?? "asc";
          constraints.push(fs.orderBy(cursor.field as any, dir));
          constraints.push(fs.where(cursor.field as any, dir === "asc" ? ">" : "<", cursor.value));
        }
        const q = fs.query(colRef, ...constraints);
        const snap = await fs.getDocs(q);
        const items = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as T[];
        const last = snap.docs[snap.docs.length - 1];
        const nextCursor = last && items.length === pageSize
          ? { field: cursor?.field ?? "id", value: last.get(cursor?.field ?? "id") }
          : null;
        return { items, nextCursor };
      }, { operation: "listPage", pageSize, cursor }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  return { getAll, getById, create, set, update, delete: delete_, query: query_, listPage, isOffline };
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface FirestoreCollection<T extends { id: string }> {
  getAll(selectFields?: string[]): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Omit<T, "id">): Promise<T>;
  set(id: string, data: T): Promise<void>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  query(constraints: QueryConstraint[], selectFields?: string[]): Promise<T[]>;
  listPage(
    pageSize: number,
    cursor?: { field: string; value: unknown; direction?: "asc" | "desc" },
  ): Promise<{ items: T[]; nextCursor: { field: string; value: unknown } | null }>;
  isOffline(): boolean;
}

export { createCollectionInternal, poolKey, collectionPool, ensureFirestoreReady, loadFirestore };

export async function createCollection<T extends { id: string }>(
  collectionPath: string,
  db?: Firestore,
): Promise<FirestoreCollection<T>> {
  const key = poolKey(collectionPath);
  const cached = collectionPool.get(key);
  if (cached) return cached as Promise<FirestoreCollection<T>>;

  const promise = createCollectionInternal<T>(collectionPath);
  collectionPool.set(key, promise);
  return promise;
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
