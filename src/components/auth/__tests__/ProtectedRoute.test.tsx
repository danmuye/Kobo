import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";
import { useAuthStore } from "@/store/auth";
import { renderWithAuth } from "@/test/test-utils";

function TestPage() {
  return <div>Protected content</div>;
}

describe("ProtectedRoute", () => {
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

  it("shows loading spinner when initializing", () => {
    useAuthStore.setState({ status: "initializing" });
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<TestPage />} />
        </Route>
      </Routes>,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("Authenticating")).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", () => {
    useAuthStore.setState({ status: "unauthenticated" });
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<TestPage />} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>,
    );
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { uid: "123", email: "test@test.com", displayName: null, photoURL: null, emailVerified: false },
    });
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<TestPage />} />
        </Route>
      </Routes>,
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
