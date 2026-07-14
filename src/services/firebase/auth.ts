import type { User } from "firebase/auth";
import { getFirebaseAuth, isConfigured, initializeFirebase, whenReady } from "./config";
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
  if (!isConfigured()) {
    throw toFirebaseServiceError({
      code: "unconfigured",
      message: "Firebase is not configured.",
    });
  }
  if (!getFirebaseStatus().isInitialized) {
    await initializeFirebase();
  }
  await whenReady();
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
  if (!isConfigured()) {
    if (import.meta.env.DEV) {
      console.log("[Auth] Firebase not configured — resolving as unauthenticated");
    }
    listener(null);
    return () => {};
  }

  if (import.meta.env.DEV) {
    console.log("[Auth] Waiting for Firebase initialization...");
  }

  let cancelled = false;
  let unsub: (() => void) | null = null;

  ensureInitialized()
    .then(() => {
      if (cancelled) return;
      if (import.meta.env.DEV) {
        console.log("[Auth] Firebase initialized — attaching auth state listener");
      }
      const auth = getFirebaseAuth();
      return import("firebase/auth").then(({ onAuthStateChanged }) => {
        if (cancelled) return;
        if (import.meta.env.DEV) {
          console.log("[Auth] Auth state listener attached");
        }
        unsub = onAuthStateChanged(auth, listener);
      });
    })
    .catch(() => {
      if (import.meta.env.DEV) {
        console.log("[Auth] Firebase initialization failed — resolving as unauthenticated");
      }
      if (!cancelled) listener(null);
    });

  return () => {
    cancelled = true;
    unsub?.();
  };
}

export async function sendEmailVerification(): Promise<void> {
  guardReady();
  await ensureInitialized();

  const auth = getFirebaseAuth();
  const { sendEmailVerification: fbSendVerification } = await import("firebase/auth");
  if (!auth.currentUser) {
    throw toFirebaseServiceError({
      code: "unauthenticated",
      message: "No user is signed in.",
    });
  }
  try {
    await fbSendVerification(auth.currentUser);
  } catch (err) {
    throw toFirebaseServiceError(err);
  }
}

export async function signInWithGoogle(): Promise<User> {
  guardReady();
  checkOnline();
  await ensureInitialized();

  const auth = getFirebaseAuth();
  const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  } catch (err) {
    throw toFirebaseServiceError(err);
  }
}

function requireCurrentUser(auth: import("firebase/auth").Auth): import("firebase/auth").User {
  if (!auth.currentUser) {
    throw toFirebaseServiceError({
      code: "unauthenticated",
      message: "No user is signed in.",
    });
  }
  return auth.currentUser;
}

export async function updateUserProfile(data: {
  displayName?: string;
  photoURL?: string | null;
}): Promise<void> {
  guardReady();
  await ensureInitialized();

  const auth = getFirebaseAuth();
  const currentUser = requireCurrentUser(auth);
  const { updateProfile } = await import("firebase/auth");
  try {
    await updateProfile(currentUser, data);
  } catch (err) {
    throw toFirebaseServiceError(err);
  }
}

export async function reauthenticateUser(password: string): Promise<void> {
  guardReady();
  await ensureInitialized();

  const auth = getFirebaseAuth();
  const currentUser = requireCurrentUser(auth);
  const { EmailAuthProvider, reauthenticateWithCredential } = await import("firebase/auth");
  try {
    const cred = EmailAuthProvider.credential(currentUser.email ?? "", password);
    await reauthenticateWithCredential(currentUser, cred);
  } catch (err) {
    throw toFirebaseServiceError(err);
  }
}

export async function changeUserPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  guardReady();
  checkOnline();
  await ensureInitialized();

  const auth = getFirebaseAuth();
  const currentUser = requireCurrentUser(auth);
  const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } =
    await import("firebase/auth");
  try {
    const cred = EmailAuthProvider.credential(currentUser.email ?? "", currentPassword);
    await reauthenticateWithCredential(currentUser, cred);
    await updatePassword(currentUser, newPassword);
  } catch (err) {
    throw toFirebaseServiceError(err);
  }
}

export async function changeUserEmail(
  currentPassword: string,
  newEmail: string,
): Promise<void> {
  guardReady();
  checkOnline();
  await ensureInitialized();

  const auth = getFirebaseAuth();
  const currentUser = requireCurrentUser(auth);
  const { EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } =
    await import("firebase/auth");
  try {
    const cred = EmailAuthProvider.credential(currentUser.email ?? "", currentPassword);
    await reauthenticateWithCredential(currentUser, cred);
    await verifyBeforeUpdateEmail(currentUser, newEmail);
  } catch (err) {
    throw toFirebaseServiceError(err);
  }
}

export async function deleteUserAccount(currentPassword: string): Promise<void> {
  guardReady();
  checkOnline();
  await ensureInitialized();

  const auth = getFirebaseAuth();
  const currentUser = requireCurrentUser(auth);
  const { EmailAuthProvider, reauthenticateWithCredential, deleteUser } =
    await import("firebase/auth");
  try {
    const cred = EmailAuthProvider.credential(currentUser.email ?? "", currentPassword);
    await reauthenticateWithCredential(currentUser, cred);
    await deleteUser(currentUser);
  } catch (err) {
    throw toFirebaseServiceError(err);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  guardReady();
  await whenReady();

  const auth = getFirebaseAuth();
  const { onAuthStateChanged } = await import("firebase/auth");
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}
