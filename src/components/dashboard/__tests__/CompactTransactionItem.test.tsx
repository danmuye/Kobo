import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompactTransactionItem } from "../CompactTransactionItem";

describe("CompactTransactionItem", () => {
  const defaultProps = {
    description: "Grocery shopping",
    category: "Food & Dining",
    amount: 12500,
    type: "expense" as const,
    timestamp: "2026-07-20",
  };

  it("renders description and category", () => {
    render(<CompactTransactionItem {...defaultProps} />);
    expect(screen.getByText("Grocery shopping")).toBeInTheDocument();
    expect(screen.getByText("Food & Dining")).toBeInTheDocument();
  });

  it("renders expense amount with minus prefix", () => {
    const { container } = render(<CompactTransactionItem {...defaultProps} />);
    expect(screen.getByText(/−/)).toBeInTheDocument();
    expect(container.textContent).toContain("₦12,500");
  });

  it("renders income amount with plus prefix", () => {
    const { container } = render(<CompactTransactionItem {...defaultProps} type="income" />);
    expect(screen.getByText(/\+/)).toBeInTheDocument();
    expect(container.textContent).toContain("₦12,500");
  });

  it("renders timestamp", () => {
    render(<CompactTransactionItem {...defaultProps} />);
    expect(screen.getByText("2026-07-20")).toBeInTheDocument();
  });

  it("fires onClick when row is clicked", () => {
    const onClick = vi.fn();
    render(<CompactTransactionItem {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByText("Grocery shopping"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("hides category on mobile via CSS class", () => {
    render(<CompactTransactionItem {...defaultProps} />);
    const category = screen.getByText("Food & Dining");
    expect(category.className).toContain("hidden");
    expect(category.className).toContain("sm:block");
  });

  it("renders description truncated for long text", () => {
    render(<CompactTransactionItem {...defaultProps} description="A very long transaction description that should be truncated with ellipsis" />);
    const desc = screen.getByText(/A very long transaction/);
    expect(desc.className).toContain("truncate");
  });

  it("handles zero amount", () => {
    const { container } = render(<CompactTransactionItem {...defaultProps} amount={0} />);
    expect(container.textContent).toContain("₦0");
  });
});
