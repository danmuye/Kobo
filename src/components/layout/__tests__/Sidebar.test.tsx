import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "../Sidebar";
import { useAuthStore } from "@/store/auth";
import { renderWithAuth } from "@/test/test-utils";

describe("Sidebar", () => {
  const defaultProps = {
    collapsed: false,
    onToggle: vi.fn(),
    mobileOpen: false,
    onMobileClose: vi.fn(),
  };

  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: "123", email: "user@test.com", displayName: "Test User", photoURL: null, emailVerified: false },
      status: "authenticated",
      error: null,
      isLoading: false,
      lastActivity: Date.now(),
      sessionExpiresAt: null,
    });
  });

  it("renders brand name and all nav items", () => {
    renderWithAuth(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Kobo")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Budgets")).toBeInTheDocument();
    expect(screen.getByText("Savings Goals")).toBeInTheDocument();
    expect(screen.getByText("Debts")).toBeInTheDocument();
    expect(screen.getByText("Accounts")).toBeInTheDocument();
    expect(screen.getByText("Wallets")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("hides labels when collapsed", () => {
    renderWithAuth(<Sidebar {...defaultProps} collapsed={true} />);
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Main navigation")).toBeInTheDocument();
  });

  it("renders user info when not collapsed", () => {
    renderWithAuth(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Free Plan")).toBeInTheDocument();
  });

  it("renders user initials when collapsed", () => {
    renderWithAuth(<Sidebar {...defaultProps} collapsed={true} />);
    expect(screen.getByText("TU")).toBeInTheDocument();
  });

  it("shows mobile overlay when mobileOpen is true", () => {
    const { container } = renderWithAuth(<Sidebar {...defaultProps} mobileOpen={true} />);
    const overlay = container.querySelector(".fixed.inset-0");
    expect(overlay).toBeInTheDocument();
  });

  it("calls onToggle when collapse button is clicked", async () => {
    const onToggle = vi.fn();
    renderWithAuth(<Sidebar {...defaultProps} onToggle={onToggle} />);
    const toggleBtn = screen.getByLabelText("Collapse sidebar");
    await userEvent.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onMobileClose when overlay is clicked", async () => {
    const onMobileClose = vi.fn();
    const { container } = renderWithAuth(
      <Sidebar {...defaultProps} mobileOpen={true} onMobileClose={onMobileClose} />,
    );
    const overlay = container.querySelector(".fixed.inset-0") as HTMLElement;
    await userEvent.click(overlay);
    expect(onMobileClose).toHaveBeenCalledTimes(1);
  });

  it("renders collapse button with correct aria-label when collapsed", () => {
    renderWithAuth(<Sidebar {...defaultProps} collapsed={true} />);
    expect(screen.getByLabelText("Expand sidebar")).toBeInTheDocument();
  });

  it("marks active nav link with aria-current", () => {
    renderWithAuth(<Sidebar {...defaultProps} />, { initialEntries: ["/dashboard"] });
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });
});
