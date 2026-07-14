import { create } from "zustand";
import type { AuthUser, AuthStatus } from "@/types/auth";

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  isLoading: boolean;
  lastActivity: number;
  sessionExpiresAt: number | null;

  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  touchActivity: () => void;
  resetSession: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: "initializing",
  error: null,
  isLoading: false,
  lastActivity: Date.now(),
  sessionExpiresAt: null,

  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  touchActivity: () =>
    set({ lastActivity: Date.now(), sessionExpiresAt: Date.now() + SESSION_TIMEOUT_MS }),
  resetSession: () => set({ lastActivity: Date.now(), sessionExpiresAt: null }),
}));
