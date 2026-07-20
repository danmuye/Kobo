import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { useSessionTimeout } from "../use-session-timeout";
import { useAuthStore } from "@/store/auth";

vi.mock("@/services/firebase/auth", () => ({
  signOutUser: vi.fn(),
}));

function TestComponent() {
  useSessionTimeout();
  return <div>Session monitor</div>;
}

describe("useSessionTimeout", () => {
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

  it("does not set up activity listeners when not authenticated", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    render(<TestComponent />);
    // No activity listeners added when status is not "authenticated"
    const mousedownCalls = addEventListenerSpy.mock.calls.filter(([event]) => event === "mousedown");
    expect(mousedownCalls.length).toBe(0);
    addEventListenerSpy.mockRestore();
  });

  it("sets up activity listeners when authenticated", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { uid: "123", email: "test@test.com", displayName: null, photoURL: null, emailVerified: false },
      sessionExpiresAt: Date.now() + 300000,
    });
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    render(<TestComponent />);
    const mousedownCalls = addEventListenerSpy.mock.calls.filter(([event]) => event === "mousedown");
    expect(mousedownCalls.length).toBeGreaterThan(0);
    addEventListenerSpy.mockRestore();
  });

  it("cleans up listeners on unmount", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { uid: "123", email: "test@test.com", displayName: null, photoURL: null, emailVerified: false },
    });
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<TestComponent />);
    unmount();
    const mousedownCalls = removeEventListenerSpy.mock.calls.filter(([event]) => event === "mousedown");
    expect(mousedownCalls.length).toBeGreaterThan(0);
    removeEventListenerSpy.mockRestore();
  });
});
