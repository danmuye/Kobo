import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyBudgetState } from "../EmptyBudgetState";

describe("EmptyBudgetState", () => {
  it("renders title and description", () => {
    render(<EmptyBudgetState onCreateNew={vi.fn()} />);
    expect(screen.getByText("No budgets yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first budget to start tracking your spending and reaching your financial goals.")).toBeInTheDocument();
  });

  it("renders create button", () => {
    render(<EmptyBudgetState onCreateNew={vi.fn()} />);
    expect(screen.getByRole("button", { name: /create your first budget/i })).toBeInTheDocument();
  });

  it("calls onCreateNew when button is clicked", async () => {
    const onCreateNew = vi.fn();
    render(<EmptyBudgetState onCreateNew={onCreateNew} />);
    await userEvent.click(screen.getByRole("button", { name: /create your first budget/i }));
    expect(onCreateNew).toHaveBeenCalledTimes(1);
  });

  it("has status role with aria-label", () => {
    render(<EmptyBudgetState onCreateNew={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "No budgets found");
  });
});
