import { describe, it, expect } from "vitest";
import {
  getBudgetStatus,
  getBudgetPeriodRange,
  getBudgetCategories,
  calculateBudgetMetrics,
  computeBudgetUtilization,
  getBudgetInsights,
  getBudgetAvailableToSpend,
  isBudgetPeriodEnded,
  getNextBudgetPeriodStart,
  getBudgetPeriodDaysRemaining,
  getBudgetAnalytics,
  migrateBudget,
} from "./budget-matching";
import { buildBudget, buildTransaction, resetCounter } from "@/test/factories";

beforeEach(() => resetCounter());

describe("getBudgetStatus", () => {
  it("returns exceeded above 100%", () => {
    expect(getBudgetStatus(150)).toEqual({ label: "Exceeded", tone: "destructive", value: "exceeded" });
  });

  it("returns completed at 100%", () => {
    expect(getBudgetStatus(100)).toEqual({ label: "Completed", tone: "success", value: "completed" });
  });

  it("returns near-limit at 90-99%", () => {
    expect(getBudgetStatus(95)).toMatchObject({ value: "near-limit" });
    expect(getBudgetStatus(90)).toMatchObject({ value: "near-limit" });
  });

  it("returns near-limit at 70-89%", () => {
    expect(getBudgetStatus(75)).toMatchObject({ value: "near-limit" });
  });

  it("returns on-track below 70%", () => {
    expect(getBudgetStatus(50)).toMatchObject({ value: "on-track" });
  });
});

describe("getBudgetCategories", () => {
  it("returns categories array when present", () => {
    expect(getBudgetCategories({ categories: ["Food", "Transport"] })).toEqual(["Food", "Transport"]);
  });

  it("falls back to single category string", () => {
    expect(getBudgetCategories({ category: "Food" })).toEqual(["Food"]);
  });

  it("returns empty array when no categories", () => {
    expect(getBudgetCategories({})).toEqual([]);
  });
});

describe("getBudgetPeriodRange", () => {
  it("returns custom range when period is Custom", () => {
    const budget = buildBudget({
      period: "Custom",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
    const range = getBudgetPeriodRange(budget, new Date("2024-06-15"));
    expect(range).not.toBeNull();
    expect(range!.start.toISOString()).toContain("2024-01-01");
    expect(range!.end.toISOString()).toContain("2024-12-31");
  });

  it("returns null for custom without dates", () => {
    const budget = buildBudget({ period: "Custom" });
    expect(getBudgetPeriodRange(budget, new Date())).toBeNull();
  });

  it("returns monthly range", () => {
    const budget = buildBudget({ period: "Monthly" });
    const range = getBudgetPeriodRange(budget, new Date("2024-06-15"));
    expect(range!.start.getMonth()).toBe(5); // June (0-indexed)
    expect(range!.start.getDate()).toBe(1);
    expect(range!.end.getMonth()).toBe(5);
    expect(range!.end.getDate()).toBe(30);
  });

  it("returns weekly range", () => {
    const budget = buildBudget({ period: "Weekly" });
    const range = getBudgetPeriodRange(budget, new Date("2024-06-19")); // Wednesday
    expect(range!.start.getDay()).toBe(1); // Monday
    expect(range!.end.getDay()).toBe(0); // Sunday
  });

  it("returns yearly range", () => {
    const budget = buildBudget({ period: "Yearly" });
    const range = getBudgetPeriodRange(budget, new Date("2024-06-15"));
    expect(range!.start.getFullYear()).toBe(2024);
    expect(range!.start.getMonth()).toBe(0);
    expect(range!.start.getDate()).toBe(1);
    expect(range!.end.getFullYear()).toBe(2024);
    expect(range!.end.getMonth()).toBe(11);
    expect(range!.end.getDate()).toBe(31);
  });
});

describe("calculateBudgetMetrics", () => {
  it("returns zero spent when no matching transactions", () => {
    const budget = buildBudget({ id: "b1" });
    const metrics = calculateBudgetMetrics(budget, [], new Date("2024-06-15"));
    expect(metrics.spent).toBe(0);
    expect(metrics.remaining).toBe(budget.amount);
    expect(metrics.percentage).toBe(0);
    expect(metrics.transactionCount).toBe(0);
    expect(metrics.isOverBudget).toBe(false);
  });

  it("calculates spent from matching transactions", () => {
    const budget = buildBudget({ id: "b1", amount: 50000 });
    const txs = [
      buildTransaction({ budgetId: "b1", amount: 5000, type: "expense", date: "2024-06-10T10:00:00Z" }),
      buildTransaction({ budgetId: "b1", amount: 3000, type: "expense", date: "2024-06-12T10:00:00Z" }),
    ];
    const metrics = calculateBudgetMetrics(budget, txs, new Date("2024-06-15"));
    expect(metrics.spent).toBe(8000);
    expect(metrics.remaining).toBe(42000);
    expect(metrics.percentage).toBeCloseTo(16, 0);
    expect(metrics.transactionCount).toBe(2);
    expect(metrics.isOverBudget).toBe(false);
  });

  it("marks over budget when spent exceeds amount", () => {
    const budget = buildBudget({ id: "b1", amount: 5000 });
    const txs = [
      buildTransaction({ budgetId: "b1", amount: 6000, type: "expense", date: "2024-06-10T10:00:00Z" }),
    ];
    const metrics = calculateBudgetMetrics(budget, txs, new Date("2024-06-15"));
    expect(metrics.isOverBudget).toBe(true);
    expect(metrics.remaining).toBe(-1000);
  });

  it("ignores income and transfer transactions", () => {
    const budget = buildBudget({ id: "b1" });
    const txs = [
      buildTransaction({ budgetId: "b1", amount: 5000, type: "income", date: "2024-06-10T10:00:00Z" }),
      buildTransaction({ budgetId: "b1", amount: 3000, type: "transfer", date: "2024-06-10T10:00:00Z" }),
    ];
    const metrics = calculateBudgetMetrics(budget, txs, new Date("2024-06-15"));
    expect(metrics.spent).toBe(0);
  });
});

describe("computeBudgetUtilization", () => {
  it("returns zeros when no budgets", () => {
    const result = computeBudgetUtilization([], []);
    expect(result.totalBudgeted).toBe(0);
    expect(result.totalSpent).toBe(0);
    expect(result.utilization).toBe(0);
  });

  it("aggregates across budgets", () => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const budgets = [
      buildBudget({ id: "b1", amount: 50000 }),
      buildBudget({ id: "b2", amount: 30000 }),
    ];
    const txs = [
      buildTransaction({ budgetId: "b1", amount: 10000, type: "expense", date: `${thisMonth}-10T10:00:00Z` }),
      buildTransaction({ budgetId: "b2", amount: 5000, type: "expense", date: `${thisMonth}-10T10:00:00Z` }),
    ];
    const result = computeBudgetUtilization(budgets, txs);
    expect(result.totalBudgeted).toBe(80000);
    expect(result.totalSpent).toBe(15000);
    expect(result.utilization).toBeCloseTo(18.75);
  });
});

describe("getBudgetInsights", () => {
  it("returns safe defaults when no period range", () => {
    const budget = buildBudget({ period: "Custom" });
    const insights = getBudgetInsights(budget, [], new Date());
    expect(insights.averageDailySpend).toBe(0);
    expect(insights.projectedRemaining).toBe(budget.amount);
    expect(insights.daysRemaining).toBe(0);
  });

  it("calculates daily spend projections", () => {
    const budget = buildBudget({ id: "b1", amount: 62000 });
    const txs = [
      buildTransaction({ budgetId: "b1", amount: 10000, type: "expense", date: "2024-06-01T10:00:00Z" }),
      buildTransaction({ budgetId: "b1", amount: 5000, type: "expense", date: "2024-06-05T10:00:00Z" }),
    ];
    const insights = getBudgetInsights(budget, txs, new Date("2024-06-15"));
    expect(insights.averageDailySpend).toBeGreaterThan(0);
    expect(insights.daysRemaining).toBeGreaterThan(0);
    expect(insights.dailyAllowance).toBeGreaterThan(0);
  });
});

describe("getBudgetAvailableToSpend", () => {
  it("returns safe defaults when no period range", () => {
    const budget = buildBudget({ period: "Custom" });
    const result = getBudgetAvailableToSpend(budget, [], new Date());
    expect(result.dailyBudget).toBe(0);
    expect(result.pace).toBe("on-track");
  });

  it("calculates daily and weekly budgets", () => {
    const budget = buildBudget({ id: "b1", amount: 31000 });
    const result = getBudgetAvailableToSpend(budget, [], new Date("2024-06-15"));
    expect(result.dailyBudget).toBeGreaterThan(0);
    expect(result.weeklyBudget).toBeGreaterThan(0);
  });
});

describe("isBudgetPeriodEnded", () => {
  it("returns true when reference date is after explicit end date", () => {
    const budget = buildBudget({
      period: "Custom",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
    expect(isBudgetPeriodEnded(budget, new Date("2025-01-01"))).toBe(true);
  });

  it("returns false when within period", () => {
    const budget = buildBudget({ period: "Monthly" });
    const ref = new Date();
    ref.setDate(15);
    expect(isBudgetPeriodEnded(budget, ref)).toBe(false);
  });
});

describe("getNextBudgetPeriodStart", () => {
  it("returns null when no period range", () => {
    const budget = buildBudget({ period: "Custom" });
    expect(getNextBudgetPeriodStart(budget, new Date())).toBeNull();
  });

  it("returns day after period end", () => {
    const budget = buildBudget({ period: "Monthly" });
    const next = getNextBudgetPeriodStart(budget, new Date("2024-06-15"));
    expect(next).not.toBeNull();
    expect(next!.getDate()).toBe(1); // July 1
  });
});

describe("getBudgetPeriodDaysRemaining", () => {
  it("returns 0 when no period range", () => {
    const budget = buildBudget({ period: "Custom" });
    expect(getBudgetPeriodDaysRemaining(budget, new Date())).toBe(0);
  });

  it("returns positive days for active budget", () => {
    const budget = buildBudget({ period: "Monthly" });
    const days = getBudgetPeriodDaysRemaining(budget, new Date("2024-06-15"));
    expect(days).toBeGreaterThan(0);
  });
});

describe("getBudgetAnalytics", () => {
  it("returns empty analytics when no period range", () => {
    const budget = buildBudget({ period: "Custom" });
    const result = getBudgetAnalytics(budget, [], new Date());
    expect(result.topCategories).toEqual([]);
    expect(result.largestTransaction).toBeNull();
    expect(result.averageTransaction).toBe(0);
    expect(result.dailyTrend).toEqual([]);
  });

  it("builds top categories and daily trend", () => {
    const budget = buildBudget({ id: "b1" });
    const txs = [
      buildTransaction({ budgetId: "b1", amount: 5000, category: "Food", type: "expense", date: "2024-06-10T10:00:00Z" }),
      buildTransaction({ budgetId: "b1", amount: 3000, category: "Transport", type: "expense", date: "2024-06-11T10:00:00Z" }),
      buildTransaction({ budgetId: "b1", amount: 2000, category: "Food", type: "expense", date: "2024-06-11T10:00:00Z" }),
    ];
    const result = getBudgetAnalytics(budget, txs, new Date("2024-06-15"));
    expect(result.topCategories).toHaveLength(2);
    expect(result.topCategories[0].name).toBe("Food");
    expect(result.largestTransaction).not.toBeNull();
    expect(result.averageTransaction).toBeCloseTo(3333.33);
    expect(result.dailyTrend).toHaveLength(2);
  });
});

describe("migrateBudget", () => {
  it("fills missing fields with defaults", () => {
    const result = migrateBudget({});
    expect(result.period).toBe("Monthly");
    expect(result.color).toBe("#3b82f6");
    expect(result.categories).toEqual([]);
  });

  it("preserves existing fields", () => {
    const result = migrateBudget({ id: "b1", name: "Test", period: "Yearly" });
    expect(result.id).toBe("b1");
    expect(result.name).toBe("Test");
    expect(result.period).toBe("Yearly");
  });
});
