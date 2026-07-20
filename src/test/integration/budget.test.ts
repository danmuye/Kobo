import { describe, it, expect, beforeEach } from "vitest";
import { useFinanceStore } from "@/store/finance";
import { buildBudget, buildTransaction, buildAccount, resetCounter } from "@/test/factories";
import { calculateBudgetMetrics, getBudgetStatus, getBudgetInsights } from "@/services/budget-matching";
import type { Budget } from "@/types";

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

describe("Budget workflow", () => {
  it("creates a budget", () => {
    useFinanceStore.getState().addBudget(buildBudget({ name: "Monthly Food", amount: 50000, categories: ["Food"] }));

    const budgets = useFinanceStore.getState().budgets;
    expect(budgets).toHaveLength(1);
    expect(budgets[0].name).toBe("Monthly Food");
    expect(budgets[0].amount).toBe(50000);
  });

  it("updates a budget", () => {
    useFinanceStore.getState().addBudget(buildBudget({ name: "Original", amount: 30000 }));
    const budget = useFinanceStore.getState().budgets[0];

    useFinanceStore.getState().updateBudget(budget.id, { name: "Updated Budget", amount: 40000 });

    expect(useFinanceStore.getState().budgets[0].name).toBe("Updated Budget");
    expect(useFinanceStore.getState().budgets[0].amount).toBe(40000);
  });

  it("deletes a budget", () => {
    useFinanceStore.getState().addBudget(buildBudget({ name: "To Delete" }));
    expect(useFinanceStore.getState().budgets).toHaveLength(1);

    useFinanceStore.getState().deleteBudget(useFinanceStore.getState().budgets[0].id);
    expect(useFinanceStore.getState().budgets).toHaveLength(0);
  });

  it("computes metrics with matching transactions", () => {
    const budget = buildBudget({ name: "Food Budget", amount: 50000 }) as Budget;
    useFinanceStore.getState().addBudget(budget);

    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 10000, budgetId: budget.id }));
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 5000, budgetId: budget.id }));
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 20000, budgetId: undefined }));

    const metrics = calculateBudgetMetrics(budget, useFinanceStore.getState().transactions);

    expect(metrics.spent).toBe(15000);
    expect(metrics.remaining).toBe(35000);
    expect(metrics.percentage).toBeCloseTo(30, 0);
    expect(metrics.transactionCount).toBe(2);

    const status = getBudgetStatus(metrics.percentage);
    expect(status.label).toBe("On Track");
    expect(status.tone).toBe("success");
  });

  it("detects over budget status", () => {
    const budget = buildBudget({ name: "Tight Budget", amount: 10000 }) as Budget;
    useFinanceStore.getState().addBudget(budget);

    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 8000, budgetId: budget.id }));
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 5000, budgetId: budget.id }));

    const metrics = calculateBudgetMetrics(budget, useFinanceStore.getState().transactions);
    expect(metrics.isOverBudget).toBe(true);
    expect(metrics.percentage).toBeGreaterThan(100);

    const status = getBudgetStatus(metrics.percentage);
    expect(status.label).toBe("Exceeded");
  });

  it("provides budget insights with days remaining", () => {
    const budget = buildBudget({ name: "Monthly Budget", amount: 30000 }) as Budget;
    useFinanceStore.getState().addBudget(budget);

    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 5000, budgetId: budget.id }));

    const insights = getBudgetInsights(budget, useFinanceStore.getState().transactions);
    expect(insights.averageDailySpend).toBeGreaterThan(0);
    expect(typeof insights.daysRemaining).toBe("number");
    expect(insights.isOverBudgetForecast).toBe(false);
  });

  it("supports full CRUD lifecycle with metrics", () => {
    expect(useFinanceStore.getState().budgets).toHaveLength(0);

    useFinanceStore.getState().addBudget(buildBudget({ name: "Test Budget", amount: 20000 }));
    expect(useFinanceStore.getState().budgets).toHaveLength(1);

    const b = useFinanceStore.getState().budgets[0];
    useFinanceStore.getState().updateBudget(b.id, { amount: 25000 });
    expect(useFinanceStore.getState().budgets[0].amount).toBe(25000);

    useFinanceStore.getState().deleteBudget(b.id);
    expect(useFinanceStore.getState().budgets).toHaveLength(0);
  });
});
