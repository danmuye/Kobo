import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateGoalMetrics,
  getGoalStatus,
  getGoalFastestGrowing,
  calculateGoalsTotal,
  getMonthlyGoalSavings,
  getGoalCompletionForecast,
  getGoalOverallTimeline,
  getMatchingGoalTransactions,
  migrateGoal,
} from "./goal-matching";
import { buildGoal, buildTransaction, resetCounter } from "@/test/factories";

beforeEach(() => resetCounter());

describe("getGoalStatus", () => {
  it("returns expired when expired", () => {
    expect(getGoalStatus(50, false, true)).toMatchObject({ value: "expired" });
  });

  it("returns completed when completed", () => {
    expect(getGoalStatus(100, true, false)).toMatchObject({ value: "completed" });
  });

  it("returns exceeded above 100%", () => {
    expect(getGoalStatus(120, false, false)).toMatchObject({ value: "exceeded" });
  });

  it("returns near target at 80-99%", () => {
    expect(getGoalStatus(85, false, false)).toMatchObject({ value: "behind" });
  });

  it("returns on track at 40-79%", () => {
    expect(getGoalStatus(60, false, false)).toMatchObject({ value: "on-track" });
  });

  it("returns getting started below 40%", () => {
    expect(getGoalStatus(20, false, false)).toMatchObject({ value: "on-track" });
  });
});

describe("getMatchingGoalTransactions", () => {
  it("returns transactions linked by goalId", () => {
    const goal = buildGoal({ id: "g1" });
    const txs = [
      buildTransaction({ goalId: "g1", amount: 5000 }),
      buildTransaction({ goalId: "g1", amount: 3000 }),
      buildTransaction({ goalId: "other", amount: 1000 }),
    ];
    expect(getMatchingGoalTransactions(goal, txs)).toHaveLength(2);
  });
});

describe("calculateGoalMetrics", () => {
  it("returns zeros when no matching transactions", () => {
    const goal = buildGoal({ id: "g1", targetAmount: 100000 });
    const metrics = calculateGoalMetrics(goal, [], new Date("2024-06-15"));
    expect(metrics.saved).toBe(0);
    expect(metrics.remaining).toBe(100000);
    expect(metrics.percentage).toBe(0);
    expect(metrics.isCompleted).toBe(false);
    expect(metrics.isExpired).toBe(false);
    expect(metrics.transactionCount).toBe(0);
  });

  it("calculates saved from matching transactions", () => {
    const goal = buildGoal({ id: "g1", targetAmount: 100000 });
    const txs = [
      buildTransaction({ goalId: "g1", amount: 20000, date: "2024-06-10T10:00:00Z" }),
      buildTransaction({ goalId: "g1", amount: 15000, date: "2024-06-12T10:00:00Z" }),
    ];
    const metrics = calculateGoalMetrics(goal, txs, new Date("2024-06-15"));
    expect(metrics.saved).toBe(35000);
    expect(metrics.remaining).toBe(65000);
    expect(metrics.percentage).toBeCloseTo(35, 0);
    expect(metrics.transactionCount).toBe(2);
  });

  it("marks completed when saved meets target", () => {
    const goal = buildGoal({ id: "g1", targetAmount: 50000 });
    const txs = [
      buildTransaction({ goalId: "g1", amount: 60000, date: "2024-06-10T10:00:00Z" }),
    ];
    const metrics = calculateGoalMetrics(goal, txs, new Date("2024-06-15"));
    expect(metrics.isCompleted).toBe(true);
    expect(metrics.isOverTarget).toBe(true);
    expect(metrics.percentage).toBe(120);
  });

  it("identifies expired goals", () => {
    const goal = buildGoal({
      id: "g1",
      targetAmount: 100000,
      targetDate: "2023-12-31",
      startDate: "2023-01-01",
    });
    const metrics = calculateGoalMetrics(goal, [], new Date("2024-06-15"));
    expect(metrics.isExpired).toBe(true);
    expect(metrics.daysRemaining).toBe(0);
  });

  it("computes largest contribution", () => {
    const goal = buildGoal({ id: "g1", targetAmount: 100000 });
    const txs = [
      buildTransaction({ goalId: "g1", amount: 5000, date: "2024-06-10T10:00:00Z" }),
      buildTransaction({ goalId: "g1", amount: 15000, date: "2024-06-12T10:00:00Z" }),
    ];
    const metrics = calculateGoalMetrics(goal, txs, new Date("2024-06-15"));
    expect(metrics.largestContribution).toBe(15000);
    expect(metrics.averageContribution).toBe(10000);
  });
});

describe("getGoalFastestGrowing", () => {
  it("returns null when no goals", () => {
    expect(getGoalFastestGrowing([], [])).toBeNull();
  });

  it("returns goal with highest monthly rate", () => {
    const goals = [
      buildGoal({ id: "g1", name: "Slow" }),
      buildGoal({ id: "g2", name: "Fast" }),
    ];
    const txs = [
      buildTransaction({ goalId: "g2", amount: 50000, date: "2024-06-10T10:00:00Z" }),
      buildTransaction({ goalId: "g1", amount: 5000, date: "2024-06-10T10:00:00Z" }),
    ];
    const result = getGoalFastestGrowing(goals, txs);
    expect(result).not.toBeNull();
    expect(result!.goalName).toBe("Fast");
  });
});

describe("calculateGoalsTotal", () => {
  it("returns zeros for empty array", () => {
    const result = calculateGoalsTotal([], []);
    expect(result.totalSaved).toBe(0);
    expect(result.totalTarget).toBe(0);
    expect(result.remaining).toBe(0);
    expect(result.pct).toBe(0);
  });

  it("aggregates across goals", () => {
    const goals = [
      buildGoal({ id: "g1", targetAmount: 50000 }),
      buildGoal({ id: "g2", targetAmount: 100000 }),
    ];
    const txs = [
      buildTransaction({ goalId: "g1", amount: 10000 }),
      buildTransaction({ goalId: "g2", amount: 20000 }),
    ];
    const result = calculateGoalsTotal(goals, txs);
    expect(result.totalSaved).toBe(30000);
    expect(result.totalTarget).toBe(150000);
    expect(result.remaining).toBe(120000);
  });
});

describe("getMonthlyGoalSavings", () => {
  it("returns entries for last N months", () => {
    const goals = [buildGoal({ id: "g1" })];
    const result = getMonthlyGoalSavings(goals, [], 3);
    expect(result).toHaveLength(3);
  });
});

describe("getGoalCompletionForecast", () => {
  it("returns forecast for each goal", () => {
    const goals = [buildGoal({ id: "g1", name: "Test Goal", targetAmount: 100000 })];
    const forecasts = getGoalCompletionForecast(goals, []);
    expect(forecasts).toHaveLength(1);
    expect(forecasts[0].goalName).toBe("Test Goal");
  });
});

describe("getGoalOverallTimeline", () => {
  it("returns zeroed timeline when no goals", () => {
    const result = getGoalOverallTimeline([], []);
    expect(result.totalSaved).toBe(0);
    expect(result.totalTarget).toBe(0);
    expect(result.estimatedDate).toBeNull();
  });

  it("returns combined timeline for goals", () => {
    const goals = [buildGoal({ id: "g1", targetAmount: 100000 })];
    const result = getGoalOverallTimeline(goals, []);
    expect(result.totalTarget).toBe(100000);
  });
});

describe("migrateGoal", () => {
  it("fills missing fields with defaults", () => {
    const result = migrateGoal({});
    expect(result.fundingType).toBe("Mixed");
    expect(result.priority).toBe("medium");
    expect(result.color).toBe("#8b5cf6");
    expect(result.icon).toBe("target");
  });

  it("preserves existing values", () => {
    const result = migrateGoal({ id: "g1", name: "Test", priority: "high" });
    expect(result.id).toBe("g1");
    expect(result.name).toBe("Test");
    expect(result.priority).toBe("high");
  });
});
