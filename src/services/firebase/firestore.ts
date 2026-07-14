import type { Firestore, QueryConstraint, DocumentData, CollectionReference, DocumentReference } from "firebase/firestore";
import { getFirestoreDb, isConfigured, initializeFirebase, whenReady } from "./config";
import { toFirebaseServiceError, type FirebaseErrorCode } from "./errors";
import { withRetry } from "./retry";
import { getFirebaseStatus } from "./status";

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

  async function withErrorHandling<R>(fn: () => Promise<R>): Promise<R> {
    try {
      return await fn();
    } catch (err) {
      throw toFirebaseServiceError(err);
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
      }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function getById(id: string): Promise<T | null> {
    return withRetry(
      () => withErrorHandling(async () => {
        const docRef = fs.doc(firestore, collectionPath, id) as DocumentReference<T>;
        const snap = await fs.getDoc(docRef);
        return snap.exists() ? ({ ...snap.data(), id: snap.id } as T) : null;
      }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function create(data: Omit<T, "id">): Promise<T> {
    return withRetry(
      () => withErrorHandling(async () => {
        const docRef = await fs.addDoc(colRef, data as DocumentData);
        return { ...data, id: docRef.id } as T;
      }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function set(id: string, data: T): Promise<void> {
    return withRetry(
      () => withErrorHandling(async () => {
        const docRef = fs.doc(firestore, collectionPath, id) as DocumentReference<T>;
        await fs.setDoc(docRef, data as DocumentData);
      }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function update(id: string, data: Partial<T>): Promise<void> {
    return withRetry(
      () => withErrorHandling(async () => {
        const docRef = fs.doc(firestore, collectionPath, id) as DocumentReference<T>;
        await fs.updateDoc(docRef, data as DocumentData);
      }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function delete_(id: string): Promise<void> {
    return withRetry(
      () => withErrorHandling(async () => {
        const docRef = fs.doc(firestore, collectionPath, id) as DocumentReference<T>;
        await fs.deleteDoc(docRef);
      }),
      { retryableCodes: FIRESTORE_RETRYABLE_CODES },
    );
  }

  async function query_(constraints: QueryConstraint[]): Promise<T[]> {
    return withRetry(
      () => withErrorHandling(async () => {
        const q = fs.query(colRef, ...constraints);
        const snap = await fs.getDocs(q);
        return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as T[];
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
