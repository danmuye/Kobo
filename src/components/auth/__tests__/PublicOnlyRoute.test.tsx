import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import PublicOnlyRoute from "../PublicOnlyRoute";
import { useAuthStore } from "@/store/auth";
import { renderWithAuth } from "@/test/test-utils";

function PublicPage() {
  return <div>Public content</div>;
}

describe("PublicOnlyRoute", () => {
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
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<PublicPage />} />
        </Route>
      </Routes>,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("Authenticating")).toBeInTheDocument();
  });

  it("redirects to /dashboard when authenticated", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { uid: "123", email: "test@test.com", displayName: null, photoURL: null, emailVerified: false },
    });
    renderWithAuth(
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<PublicPage />} />
        </Route>
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
      </Routes>,
    );
    expect(screen.getByText("Dashboard page")).toBeInTheDocument();
  });

  it("renders children when not authenticated", () => {
    useAuthStore.setState({ status: "unauthenticated" });
    renderWithAuth(
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<PublicPage />} />
        </Route>
      </Routes>,
    );
    expect(screen.getByText("Public content")).toBeInTheDocument();
  });
});
