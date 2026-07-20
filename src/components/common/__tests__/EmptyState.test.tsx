import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "../EmptyState";
import { Inbox } from "lucide-react";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState icon={Inbox} title="No items" description="No items found." />);
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("No items found.")).toBeInTheDocument();
  });

  it("renders action button when action is provided", () => {
    const onClick = vi.fn();
    render(<EmptyState icon={Inbox} title="Empty" action={{ label: "Add item", onClick }} />);
    expect(screen.getByRole("button", { name: /add item/i })).toBeInTheDocument();
  });

  it("calls onClick when action button is clicked", async () => {
    const onClick = vi.fn();
    render(<EmptyState icon={Inbox} title="Empty" action={{ label: "Create", onClick }} />);
    await userEvent.click(screen.getByRole("button", { name: /create/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders with aria-label from title", () => {
    render(<EmptyState icon={Inbox} title="No budgets" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "No budgets");
  });

  it("renders compact variant with reduced padding", () => {
    const { container } = render(<EmptyState icon={Inbox} title="Compact" compact />);
    const status = screen.getByRole("status");
    expect(status.className).toContain("py-8");
  });

  it("renders children", () => {
    render(
      <EmptyState icon={Inbox} title="Test">
        <p>Child content</p>
      </EmptyState>,
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });
});
