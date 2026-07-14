import type { FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import type { FirebaseStorage } from "firebase/storage";
import { toFirebaseServiceError } from "./errors";
import { updateFirebaseStatus, startConnectionMonitoring } from "./status";

const REQUIRED_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
] as const;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

let initPromise: Promise<void> | null = null;
let initResolved = false;
let initError: Error | null = null;
let monitoringCleanup: (() => void) | null = null;

function getMissingVars(): string[] {
  return REQUIRED_VARS.filter((key) => !import.meta.env[key]);
}

export function isConfigured(): boolean {
  return getMissingVars().length === 0;
}

export function getMissingConfigKeys(): string[] {
  return getMissingVars();
}

export function whenReady(): Promise<void> {
  if (initResolved) return Promise.resolve();
  if (initError) return Promise.reject(initError);
  if (initPromise) return initPromise;
  return Promise.resolve();
}

export async function initializeFirebase(): Promise<void> {
  if (initResolved) return;
  if (initError) return;
  if (initPromise) return initPromise;

  updateFirebaseStatus({ isConfigured: isConfigured() });

  if (!isConfigured()) {
    updateFirebaseStatus({ connection: "disconnected", isInitialized: false });
    return;
  }

  initPromise = (async () => {
    try {
      updateFirebaseStatus({ connection: "connecting" });

      const { initializeApp } = await import("firebase/app");
      const { getFirestore, enableMultiTabIndexedDbPersistence, CACHE_SIZE_UNLIMITED } =
        await import("firebase/firestore");
      const { getAuth } = await import("firebase/auth");
      const { getStorage } = await import("firebase/storage");

      const firebaseApp = initializeApp(firebaseConfig);
      app = firebaseApp;

      const firestore = getFirestore(firebaseApp);
      db = firestore;

      const firebaseAuth = getAuth(firebaseApp);
      auth = firebaseAuth;

      const firebaseStorage = getStorage(firebaseApp);
      storage = firebaseStorage;

      try {
        await enableMultiTabIndexedDbPersistence(firestore);
      } catch (err) {
        const fbErr = err as { code?: string };
        if (fbErr.code === "failed-precondition") {
        } else if (fbErr.code === "unimplemented") {
        }
      }

      monitoringCleanup = startConnectionMonitoring();
      initResolved = true;
      updateFirebaseStatus({ connection: "connected", isInitialized: true });
    } catch (err) {
      initError = err instanceof Error ? err : new Error(String(err));
      updateFirebaseStatus({ connection: "disconnected", isInitialized: false });

      if (import.meta.env.DEV) {
        console.error("[Firebase] Initialization failed:", err);
      }

      throw toFirebaseServiceError(err);
    }
  })();

  return initPromise;
}

export function getFirebaseApp(): FirebaseApp {
  if (!initResolved) {
    throw toFirebaseServiceError({
      code: "unconfigured",
      message: "Firebase not initialized. Call initializeFirebase() first.",
    });
  }
  if (!app) {
    throw toFirebaseServiceError({
      code: "unconfigured",
      message: "Firebase app not available.",
    });
  }
  return app;
}

export function getFirestoreDb(): Firestore {
  if (!initResolved) {
    throw toFirebaseServiceError({
      code: "unconfigured",
      message: "Firestore not initialized. Call initializeFirebase() first.",
    });
  }
  if (!db) {
    throw toFirebaseServiceError({
      code: "unconfigured",
      message: "Firestore not available.",
    });
  }
  return db;
}

export function getFirebaseAuth(): Auth {
  if (!initResolved) {
    throw toFirebaseServiceError({
      code: "unconfigured",
      message: "Auth not initialized. Call initializeFirebase() first.",
    });
  }
  if (!auth) {
    throw toFirebaseServiceError({
      code: "unconfigured",
      message: "Auth not available.",
    });
  }
  return auth;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!initResolved) {
    throw toFirebaseServiceError({
      code: "unconfigured",
      message: "Storage not initialized. Call initializeFirebase() first.",
    });
  }
  if (!storage) {
    throw toFirebaseServiceError({
      code: "unconfigured",
      message: "Storage not available.",
    });
  }
  return storage;
}

export function destroyFirebase(): void {
  monitoringCleanup?.();
  monitoringCleanup = null;
  app = null;
  db = null;
  auth = null;
  storage = null;
  initPromise = null;
  initResolved = false;
  initError = null;
  updateFirebaseStatus({ connection: "disconnected", isInitialized: false });
}
