export class FirebaseServiceError extends Error {
  readonly code: string;
  readonly original: unknown;
  readonly timestamp: string;

  constructor(code: string, message: string, original?: unknown) {
    super(message);
    this.name = "FirebaseServiceError";
    this.code = code;
    this.original = original;
    this.timestamp = new Date().toISOString();
  }
}

export type FirebaseErrorCode =
  | "unconfigured"
  | "unavailable"
  | "unauthenticated"
  | "not-found"
  | "already-exists"
  | "permission-denied"
  | "resource-exhausted"
  | "cancelled"
  | "deadline-exceeded"
  | "invalid-argument"
  | "internal"
  | "network-error"
  | "rate-limited"
  | "offline"
  | "unknown";

function isFirebaseError(err: unknown): err is { code: string; message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as Record<string, unknown>).code === "string"
  );
}

const FIREBASE_CODE_MAP: Record<string, FirebaseErrorCode> = {
  "auth/user-not-found": "not-found",
  "auth/wrong-password": "invalid-argument",
  "auth/email-already-in-use": "already-exists",
  "auth/weak-password": "invalid-argument",
  "auth/invalid-credential": "invalid-argument",
  "auth/user-disabled": "permission-denied",
  "auth/too-many-requests": "rate-limited",
  "auth/network-request-failed": "network-error",
  "auth/invalid-email": "invalid-argument",
  "auth/operation-not-allowed": "permission-denied",
  "auth/requires-recent-login": "permission-denied",
  "firestore/permission-denied": "permission-denied",
  "firestore/not-found": "not-found",
  "firestore/already-exists": "already-exists",
  "firestore/resource-exhausted": "resource-exhausted",
  "firestore/cancelled": "cancelled",
  "firestore/deadline-exceeded": "deadline-exceeded",
  "firestore/unavailable": "unavailable",
  "firestore/aborted": "internal",
  "storage/object-not-found": "not-found",
  "storage/unauthorized": "permission-denied",
  "storage/retry-limit-exceeded": "rate-limited",
  "storage/canceled": "cancelled",
  "storage/unknown": "unknown",
};

export function classifyFirebaseError(err: unknown): FirebaseErrorCode {
  if (err instanceof FirebaseServiceError) return err.code as FirebaseErrorCode;
  if (isFirebaseError(err)) {
    return FIREBASE_CODE_MAP[err.code] ?? "unknown";
  }
  if (err instanceof TypeError && err.message === "Failed to fetch") {
    return "network-error";
  }
  return "unknown";
}

export function describeFirebaseError(code: FirebaseErrorCode): string {
  const descriptions: Record<FirebaseErrorCode, string> = {
    unconfigured: "Firebase is not configured. Check your environment variables.",
    unavailable: "Service is temporarily unavailable. Please try again.",
    unauthenticated: "You must sign in to perform this action.",
    "not-found": "The requested data was not found.",
    "already-exists": "This record already exists.",
    "permission-denied": "You do not have permission to perform this action.",
    "resource-exhausted": "Too many requests. Please slow down.",
    cancelled: "The operation was cancelled.",
    "deadline-exceeded": "The operation timed out. Please try again.",
    "invalid-argument": "Invalid data provided. Check your input.",
    internal: "An unexpected error occurred. Please try again.",
    "network-error": "Network error. Check your connection.",
    "rate-limited": "Too many requests. Please wait before trying again.",
    offline: "You are offline. Changes will sync when you reconnect.",
    unknown: "An unexpected error occurred. Please try again.",
  };
  return descriptions[code];
}

export function toFirebaseServiceError(err: unknown): FirebaseServiceError {
  if (err instanceof FirebaseServiceError) return err;
  const code = classifyFirebaseError(err);
  const message = describeFirebaseError(code);
  return new FirebaseServiceError(code, message, err);
}
