import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationItem } from "../NotificationItem";
import type { AppNotification } from "@/types/notifications";

function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: "n1",
    title: "Budget alert",
    message: "You've exceeded your food budget",
    type: "warning",
    category: "budget",
    timestamp: new Date().toISOString(),
    read: false,
    ...overrides,
  };
}

describe("NotificationItem", () => {
  it("renders title and message", () => {
    render(
      <NotificationItem notification={makeNotification()} onMarkRead={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("Budget alert")).toBeInTheDocument();
    expect(screen.getByText("You've exceeded your food budget")).toBeInTheDocument();
  });

  it("shows mark-read button when unread", () => {
    render(
      <NotificationItem notification={makeNotification({ read: false })} onMarkRead={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByLabelText(/mark.*read/i)).toBeInTheDocument();
  });

  it("hides mark-read button when read", () => {
    render(
      <NotificationItem notification={makeNotification({ read: true })} onMarkRead={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.queryByLabelText(/mark.*read/i)).not.toBeInTheDocument();
  });

  it("calls onMarkRead when mark read button is clicked", async () => {
    const onMarkRead = vi.fn();
    render(
      <NotificationItem notification={makeNotification()} onMarkRead={onMarkRead} onDelete={vi.fn()} />,
    );
    await userEvent.click(screen.getByLabelText(/mark.*read/i));
    expect(onMarkRead).toHaveBeenCalledWith("n1");
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(
      <NotificationItem notification={makeNotification()} onMarkRead={vi.fn()} onDelete={onDelete} />,
    );
    await userEvent.click(screen.getByLabelText(/delete.*budget alert/i));
    expect(onDelete).toHaveBeenCalledWith("n1");
  });

  it("shows unread indicator dot when unread", () => {
    render(
      <NotificationItem notification={makeNotification({ read: false })} onMarkRead={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByLabelText("Unread")).toBeInTheDocument();
  });

  it("applies reduced opacity for read notifications", () => {
    const { container } = render(
      <NotificationItem notification={makeNotification({ read: true })} onMarkRead={vi.fn()} onDelete={vi.fn()} />,
    );
    const item = container.querySelector("[role='listitem']");
    expect(item?.className).toContain("opacity-60");
  });

  it("renders with role listitem", () => {
    render(
      <NotificationItem notification={makeNotification()} onMarkRead={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByRole("listitem")).toBeInTheDocument();
  });

  it("renders category label", () => {
    render(
      <NotificationItem notification={makeNotification({ category: "budget" })} onMarkRead={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("budget")).toBeInTheDocument();
  });
});
