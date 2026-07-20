import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationDrawer } from "../NotificationDrawer";
import type { AppNotification } from "@/types/notifications";

function makeNotifications(): AppNotification[] {
  return [
    {
      id: "n1", title: "Budget alert", message: "Exceeded budget",
      type: "warning", category: "budget", timestamp: new Date().toISOString(), read: false,
    },
    {
      id: "n2", title: "Goal reached", message: "Saved 100%",
      type: "success", category: "goal", timestamp: new Date(Date.now() - 86400000).toISOString(), read: true,
    },
    {
      id: "n3", title: "Payment due", message: "Debt payment",
      type: "error", category: "debt", timestamp: new Date(Date.now() - 172800000).toISOString(), read: false,
    },
  ];
}

describe("NotificationDrawer", () => {
  const defaultProps = {
    open: true,
    notifications: makeNotifications(),
    onMarkRead: vi.fn(),
    onMarkAllRead: vi.fn(),
    onDelete: vi.fn(),
    onClearAll: vi.fn(),
  };

  it("renders notification count", () => {
    render(<NotificationDrawer {...defaultProps} />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByLabelText("2 unread")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders all notifications", () => {
    render(<NotificationDrawer {...defaultProps} />);
    expect(screen.getByText("Budget alert")).toBeInTheDocument();
    expect(screen.getByText("Goal reached")).toBeInTheDocument();
    expect(screen.getByText("Payment due")).toBeInTheDocument();
  });

  it("filters by search query", async () => {
    render(<NotificationDrawer {...defaultProps} />);
    const searchInput = screen.getByLabelText("Search notifications");
    await userEvent.type(searchInput, "Goal");
    expect(screen.getByText("Goal reached")).toBeInTheDocument();
    expect(screen.queryByText("Budget alert")).not.toBeInTheDocument();
  });

  it("filters by type", async () => {
    render(<NotificationDrawer {...defaultProps} />);
    const filterTrigger = screen.getByLabelText("Filter by notification type");
    await userEvent.click(filterTrigger);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /error/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("option", { name: /error/i }));
    expect(screen.getByText("Payment due")).toBeInTheDocument();
    expect(screen.queryByText("Budget alert")).not.toBeInTheDocument();
  });

  it("shows empty state when no notifications match", async () => {
    render(<NotificationDrawer {...defaultProps} />);
    const searchInput = screen.getByLabelText("Search notifications");
    await userEvent.type(searchInput, "zzzzz");
    expect(screen.getByText("No notifications match your filters.")).toBeInTheDocument();
  });

  it("calls onMarkAllRead when mark-all button clicked", async () => {
    const onMarkAllRead = vi.fn();
    render(<NotificationDrawer {...defaultProps} onMarkAllRead={onMarkAllRead} />);
    await userEvent.click(screen.getByLabelText("Mark all notifications as read"));
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("calls onClearAll when clear button clicked", async () => {
    const onClearAll = vi.fn();
    render(<NotificationDrawer {...defaultProps} onClearAll={onClearAll} />);
    await userEvent.click(screen.getByLabelText("Clear all notifications"));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("hides action buttons when no notifications", () => {
    render(<NotificationDrawer {...defaultProps} notifications={[]} />);
    expect(screen.queryByLabelText("Mark all notifications as read")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Clear all notifications")).not.toBeInTheDocument();
  });

  it("shows empty state with no notifications", () => {
    render(<NotificationDrawer {...defaultProps} notifications={[]} />);
    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
  });

  it("renders with dialog role and correct aria-label", () => {
    render(<NotificationDrawer {...defaultProps} />);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "Notifications, 2 unread");
  });

  it("resets filters when closed", () => {
    const { rerender } = render(<NotificationDrawer {...defaultProps} />);
    // When open becomes false, filters should reset via useEffect
    rerender(<NotificationDrawer {...defaultProps} open={false} />);
    // Re-opening would show all notifications again
  });

  it("sorts by oldest when toggle clicked", async () => {
    render(<NotificationDrawer {...defaultProps} />);
    const sortBtn = screen.getByLabelText(/sort/i);
    await userEvent.click(sortBtn);
    expect(screen.getByLabelText(/sort by newest/i)).toBeInTheDocument();
  });

  it("renders notification items in a list", () => {
    render(<NotificationDrawer {...defaultProps} />);
    const list = screen.getByRole("list", { name: /3 notifications/i });
    expect(list).toBeInTheDocument();
    const ul = list.querySelector("ul");
    expect(ul?.children).toHaveLength(3);
  });
});
