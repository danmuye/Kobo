export {
  initializeFirebase,
  isConfigured,
  getMissingConfigKeys,
  getFirebaseApp,
  getFirestoreDb,
  getFirebaseAuth,
  getFirebaseStorage,
  destroyFirebase,
  whenReady,
} from "./config";

export {
  signIn, signUp, signOutUser, resetPassword,
  onAuthChange, getCurrentUser, sendEmailVerification,
  signInWithGoogle, updateUserProfile,
  reauthenticateUser, changeUserPassword, changeUserEmail, deleteUserAccount,
} from "./auth";

export {
  createUserDocuments, createUserDocumentsIfNeeded, userDocumentExists,
  updateUserProfileDocument, deleteUserDocuments,
} from "./user-service";

export { createCollection, where, orderBy, limit } from "./firestore";
export type { FirestoreCollection, QueryConstraint } from "./firestore";

export { FirebaseStorageService } from "../implementations/firebase-storage/storage";

export {
  FirebaseServiceError,
  classifyFirebaseError,
  describeFirebaseError,
  toFirebaseServiceError,
} from "./errors";
export type { FirebaseErrorCode } from "./errors";

export { withRetry, getWriteQueue, addToWriteQueue, removeFromWriteQueue, retryQueuedWrites, setupRetryQueue } from "./retry";
export type { RetryOptions } from "./retry";

export { sanitizeFirestoreData } from "./sanitize";

export {
  getFirebaseStatus,
  updateFirebaseStatus,
  onFirebaseStatusChange,
  startConnectionMonitoring,
} from "./status";
export type { ConnectionState, FirebaseStatus } from "./status";
