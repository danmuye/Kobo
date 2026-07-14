import { createContext, useContext, useEffect, useRef } from "react";
import type { AuthUser } from "@/types/auth";
import { useAuthStore } from "@/store/auth";
import { onAuthChange, getCurrentUser } from "@/services/firebase/auth";
import type { User } from "firebase/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapFirebaseUser(fbUser: User): AuthUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    photoURL: fbUser.photoURL,
    emailVerified: fbUser.emailVerified,
    createdAt: fbUser.metadata?.creationTime ?? undefined,
    lastLoginAt: fbUser.metadata?.lastSignInTime ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setStatus = useAuthStore((s) => s.setStatus);
  const touchActivity = useAuthStore((s) => s.touchActivity);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[Auth] Initializing auth provider...");
    }

    unsubRef.current = onAuthChange((fbUser: User | null) => {
      if (import.meta.env.DEV) {
        console.log(
          "[Auth] Auth state changed:",
          fbUser?.uid ? `user=${fbUser.uid}` : "no user",
        );
      }
      if (fbUser) {
        setUser(mapFirebaseUser(fbUser));
        setStatus("authenticated");
        touchActivity();
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
      if (import.meta.env.DEV) {
        console.log("[Auth] Loading resolved");
      }
    });

    return () => {
      if (import.meta.env.DEV) {
        console.log("[Auth] Cleaning up auth provider");
      }
      unsubRef.current?.();
    };
  }, [setUser, setStatus, touchActivity]);

  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  const value: AuthContextValue = {
    user,
    isAuthenticated: status === "authenticated",
    isInitializing: status === "initializing",
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
