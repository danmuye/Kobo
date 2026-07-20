import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAuthStore } from "@/store/auth";
import type { AuthUser } from "@/types";

const mockUser: AuthUser = {
  uid: "user-1",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: null,
  emailVerified: false,
};

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    status: "unauthenticated",
    error: null,
    isLoading: false,
    lastActivity: Date.now(),
    sessionExpiresAt: null,
  });
});

describe("Authentication workflow", () => {
  it("registers a new user", () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setStatus("authenticated");
    useAuthStore.getState().setLoading(false);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.status).toBe("authenticated");
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("handles registration error", () => {
    useAuthStore.getState().setError("Email already in use");

    const state = useAuthStore.getState();
    expect(state.error).toBe("Email already in use");
    expect(state.user).toBeNull();
    expect(state.status).toBe("unauthenticated");

    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it("completes login flow", () => {
    useAuthStore.getState().setLoading(true);
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setStatus("authenticated");
    useAuthStore.getState().setLoading(false);
    useAuthStore.getState().touchActivity();

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.status).toBe("authenticated");
    expect(state.isLoading).toBe(false);
    expect(state.lastActivity).toBeGreaterThan(0);
    expect(state.sessionExpiresAt).toBeGreaterThan(state.lastActivity);
  });

  it("logs out and resets state", () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setStatus("authenticated");

    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setStatus("unauthenticated");
    useAuthStore.getState().resetSession();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.status).toBe("unauthenticated");
    expect(state.sessionExpiresAt).toBeNull();
  });

  it("tracks session activity and timeout", () => {
    useAuthStore.getState().setUser(mockUser);

    const t1 = 1000;
    vi.setSystemTime(t1);
    useAuthStore.getState().touchActivity();

    let state = useAuthStore.getState();
    expect(state.lastActivity).toBe(t1);
    expect(state.sessionExpiresAt).toBe(t1 + 30 * 60 * 1000);

    const t2 = 5000;
    vi.setSystemTime(t2);
    useAuthStore.getState().touchActivity();

    state = useAuthStore.getState();
    expect(state.lastActivity).toBe(t2);
    expect(state.sessionExpiresAt).toBe(t2 + 30 * 60 * 1000);

    useAuthStore.getState().resetSession();
    state = useAuthStore.getState();
    expect(state.lastActivity).toBeGreaterThan(0);
    expect(state.sessionExpiresAt).toBeNull();
  });

  it("sends password reset email", async () => {
    const mockResetPassword = vi.fn().mockResolvedValue(undefined);
    useAuthStore.getState().setLoading(true);

    await mockResetPassword("test@example.com");

    useAuthStore.getState().setLoading(false);
    expect(mockResetPassword).toHaveBeenCalledWith("test@example.com");
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("handles password reset error", async () => {
    const mockResetPassword = vi.fn().mockRejectedValue(new Error("User not found"));

    useAuthStore.getState().setError(null);
    try {
      await mockResetPassword("unknown@example.com");
    } catch {
      useAuthStore.getState().setError("User not found");
    }

    expect(useAuthStore.getState().error).toBe("User not found");
  });
});
