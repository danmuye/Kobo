import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Plus } from "lucide-react";
import { QuickActionCard } from "../QuickActionCard";

describe("QuickActionCard", () => {
  const defaultProps = {
    icon: Plus,
    label: "Transaction",
    onClick: vi.fn(),
  };

  it("renders icon and label", () => {
    render(<QuickActionCard {...defaultProps} />);
    expect(screen.getByText("Transaction")).toBeInTheDocument();
  });

  it("fires onClick when clicked", () => {
    render(<QuickActionCard {...defaultProps} />);
    fireEvent.click(screen.getByRole("button"));
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it("fires onClick when label text is clicked (event bubbles)", () => {
    render(<QuickActionCard {...defaultProps} />);
    fireEvent.click(screen.getByText("Transaction"));
    expect(defaultProps.onClick).toHaveBeenCalled();
  });

  it("renders with primary variant styling", () => {
    render(<QuickActionCard {...defaultProps} variant="primary" />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("primary");
  });

  it("label is hidden on mobile via CSS class", () => {
    render(<QuickActionCard {...defaultProps} />);
    const label = screen.getByText("Transaction");
    expect(label.className).toContain("hidden");
    expect(label.className).toContain("md:inline");
  });

  it("has accessible aria-label", () => {
    render(<QuickActionCard {...defaultProps} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Transaction");
  });
});
