import type { User } from "firebase/auth";
import { getFirebaseAuth, getFirebaseApp, isConfigured, initializeFirebase } from "./config";
import { toFirebaseServiceError, type FirebaseErrorCode } from "./errors";
import { withRetry } from "./retry";
import { getFirebaseStatus } from "./status";

export type AuthStateListener = (user: User | null) => void;

const AUTH_RETRYABLE_CODES: FirebaseErrorCode[] = [
  "network-error",
  "unavailable",
  "deadline-exceeded",
];

function guardReady() {
  if (!isConfigured()) {
    throw toFirebaseServiceError({
      code: "unconfigured",
      message: "Firebase is not configured.",
    });
  }
}

function checkOnline() {
  if (!getFirebaseStatus().isOnline) {
    throw toFirebaseServiceError({
      code: "offline",
      message: "You appear to be offline. Please check your connection.",
    });
  }
}

async function ensureInitialized(): Promise<void> {
  const status = getFirebaseStatus();
  if (!status.isConfigured) {
    throw toFirebaseServiceError({
      code: "unconfigured",
      message: "Firebase is not configured.",
    });
  }
  if (!status.isInitialized) {
    await initializeFirebase();
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  guardReady();
  checkOnline();
  await ensureInitialized();

  return withRetry(async () => {
    const auth = getFirebaseAuth();
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    } catch (err) {
      throw toFirebaseServiceError(err);
    }
  }, { retryableCodes: AUTH_RETRYABLE_CODES });
}

export async function signUp(email: string, password: string): Promise<User> {
  guardReady();
  checkOnline();
  await ensureInitialized();

  return withRetry(async () => {
    const auth = getFirebaseAuth();
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return cred.user;
    } catch (err) {
      throw toFirebaseServiceError(err);
    }
  }, { retryableCodes: AUTH_RETRYABLE_CODES });
}

export async function signOutUser(): Promise<void> {
  guardReady();
  await ensureInitialized();

  try {
    const auth = getFirebaseAuth();
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  } catch (err) {
    throw toFirebaseServiceError(err);
  }
}

export async function resetPassword(email: string): Promise<void> {
  guardReady();
  checkOnline();
  await ensureInitialized();

  return withRetry(async () => {
    const auth = getFirebaseAuth();
    const { sendPasswordResetEmail } = await import("firebase/auth");
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      throw toFirebaseServiceError(err);
    }
  }, { retryableCodes: AUTH_RETRYABLE_CODES });
}

export function onAuthChange(listener: AuthStateListener): () => void {
  if (!isConfigured()) return () => {};
  const auth = getFirebaseAuth();
  let unsub: (() => void) | null = null;
  import("firebase/auth").then(({ onAuthStateChanged }) => {
    unsub = onAuthStateChanged(auth, listener);
  });
  return () => unsub?.();
}

export async function getCurrentUser(): Promise<User | null> {
  guardReady();
  await ensureInitialized();

  const auth = getFirebaseAuth();
  const { onAuthStateChanged } = await import("firebase/auth");
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}
