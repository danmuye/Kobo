import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore, SESSION_TIMEOUT_MS } from "./auth";
import type { AuthUser } from "@/types/auth";

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    status: "initializing",
    error: null,
    isLoading: false,
    lastActivity: Date.now(),
    sessionExpiresAt: null,
  });
});

describe("useAuthStore", () => {
  it("starts in initializing status", () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe("initializing");
    expect(state.user).toBeNull();
  });

  describe("setUser", () => {
    it("sets user to provided value", () => {
      const user: AuthUser = { uid: "abc", email: "test@test.com", displayName: null, photoURL: null, emailVerified: false };
      useAuthStore.getState().setUser(user);
      expect(useAuthStore.getState().user).toEqual(user);
    });

    it("sets user to null", () => {
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe("setStatus", () => {
    it("updates auth status", () => {
      useAuthStore.getState().setStatus("authenticated");
      expect(useAuthStore.getState().status).toBe("authenticated");
    });
  });

  describe("setError / clearError", () => {
    it("sets and clears error", () => {
      useAuthStore.getState().setError("Something went wrong");
      expect(useAuthStore.getState().error).toBe("Something went wrong");
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("setLoading", () => {
    it("updates loading state", () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe("touchActivity", () => {
    it("updates lastActivity and sets sessionExpiresAt", () => {
      const now = Date.now();
      vi.setSystemTime(now);
      useAuthStore.getState().touchActivity();
      const state = useAuthStore.getState();
      expect(state.lastActivity).toBe(now);
      expect(state.sessionExpiresAt).toBe(now + SESSION_TIMEOUT_MS);
      vi.useRealTimers();
    });
  });

  describe("resetSession", () => {
    it("resets lastActivity and clears sessionExpiresAt", () => {
      const now = Date.now();
      vi.setSystemTime(now);
      useAuthStore.setState({ lastActivity: now - 10000, sessionExpiresAt: now + SESSION_TIMEOUT_MS });
      useAuthStore.getState().resetSession();
      const state = useAuthStore.getState();
      expect(state.lastActivity).toBe(now);
      expect(state.sessionExpiresAt).toBeNull();
      vi.useRealTimers();
    });
  });
});
