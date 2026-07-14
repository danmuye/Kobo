export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

export interface ProfileUpdate {
  displayName?: string;
  photoURL?: string | null;
}
