import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetCard } from "../BudgetCard";
import { useFinanceStore } from "@/store/finance";
import { buildBudget, resetCounter } from "@/test/factories";
import { renderWithProviders } from "@/test/test-utils";
import type { BudgetMetrics } from "@/services/budget-matching";

beforeEach(() => {
  resetCounter();
  useFinanceStore.setState({
    transactions: [],
    budgets: [],
    budgetHistory: [],
    goals: [],
    goalHistory: [],
    debts: [],
    debtHistory: [],
    accounts: [],
  });
});

function makeMetrics(overrides: Partial<BudgetMetrics> = {}): BudgetMetrics {
  return {
    spent: 25000,
    remaining: 25000,
    percentage: 50,
    transactionCount: 5,
    isOverBudget: false,
    ...overrides,
  };
}

describe("BudgetCard", () => {
  it("renders budget name and amount", () => {
    const budget = buildBudget({ name: "Food Budget", amount: 50000 });
    renderWithProviders(<BudgetCard budget={budget} metrics={makeMetrics()} />);
    expect(screen.getByText("Food Budget")).toBeInTheDocument();
    expect(screen.getByText("₦50,000")).toBeInTheDocument();
  });

  it("renders spent amount", () => {
    const budget = buildBudget({ name: "Food", amount: 50000 });
    renderWithProviders(<BudgetCard budget={budget} metrics={makeMetrics({ spent: 25000 })} />);
    const matches = screen.getAllByText("₦25,000");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("shows status badge", () => {
    const budget = buildBudget({ name: "Test", amount: 50000 });
    renderWithProviders(<BudgetCard budget={budget} metrics={makeMetrics({ percentage: 50 })} />);
    const matches = screen.getAllByText("On Track");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("shows exceeded styling when over budget", () => {
    const budget = buildBudget({ name: "Over", amount: 50000 });
    renderWithProviders(<BudgetCard budget={budget} metrics={makeMetrics({ percentage: 120, spent: 60000, remaining: -10000, isOverBudget: true })} />);
    const matches = screen.getAllByText("Exceeded");
    expect(matches.length).toBeGreaterThan(0);
    expect(screen.getByText("₦10,000 over")).toBeInTheDocument();
  });

  it("shows progress bar with correct width", () => {
    const budget = buildBudget({ name: "Test", amount: 50000 });
    renderWithProviders(<BudgetCard budget={budget} metrics={makeMetrics({ percentage: 75 })} />);
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "75");
  });

  it("calls onEdit when edit is clicked", async () => {
    const onEdit = vi.fn();
    const budget = buildBudget({ name: "Editable", amount: 50000 });
    renderWithProviders(<BudgetCard budget={budget} metrics={makeMetrics()} onEdit={onEdit} />);
    await userEvent.click(screen.getByLabelText("Actions"));
    await userEvent.click(screen.getByText("Edit Budget"));
    expect(onEdit).toHaveBeenCalledWith(budget);
  });

  it("calls onDelete when delete is clicked", async () => {
    const onDelete = vi.fn();
    const budget = buildBudget({ name: "Deletable", amount: 50000 });
    renderWithProviders(<BudgetCard budget={budget} metrics={makeMetrics()} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText("Actions"));
    await userEvent.click(screen.getByText("Delete Budget"));
    expect(onDelete).toHaveBeenCalledWith(budget);
  });

  it("toggles insights panel", async () => {
    const budget = buildBudget({ name: "Insights", amount: 50000 });
    renderWithProviders(<BudgetCard budget={budget} metrics={makeMetrics()} />);
    await userEvent.click(screen.getByLabelText("Actions"));
    await userEvent.click(screen.getByText("Show Insights"));
  });
});
