import { describe, it, expect, beforeEach } from "vitest";
import { useFinanceStore } from "@/store/finance";
import { buildGoal, buildTransaction, resetCounter } from "@/test/factories";
import { calculateGoalMetrics, getGoalStatus, getGoalFastestGrowing, calculateGoalsTotal, getGoalCompletionForecast } from "@/services/goal-matching";
import type { Goal } from "@/types";

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

describe("Savings Goals workflow", () => {
  it("creates a savings goal", () => {
    useFinanceStore.getState().addGoal(buildGoal({
      name: "Emergency Fund",
      targetAmount: 500000,
      priority: "high",
    }));

    const goals = useFinanceStore.getState().goals;
    expect(goals).toHaveLength(1);
    expect(goals[0].name).toBe("Emergency Fund");
    expect(goals[0].targetAmount).toBe(500000);
  });

  it("contributes to a goal and updates metrics", () => {
    const goal = buildGoal({ name: "Vacation", targetAmount: 200000 }) as Goal;
    useFinanceStore.getState().addGoal(goal);

    useFinanceStore.getState().addTransaction(buildTransaction({
      description: "Vacation contribution",
      amount: 50000,
      type: "expense",
      category: "Savings",
      goalId: goal.id,
    }));

    const metrics = calculateGoalMetrics(goal, useFinanceStore.getState().transactions);
    expect(metrics.saved).toBe(50000);
    expect(metrics.remaining).toBe(150000);
    expect(metrics.percentage).toBe(25);
    expect(metrics.transactionCount).toBe(1);

    const status = getGoalStatus(metrics.percentage, metrics.isCompleted, metrics.isExpired);
    expect(status.label).toBe("Getting Started");
  });

  it("completes a goal when target is reached", () => {
    const goal = buildGoal({ name: "Laptop Fund", targetAmount: 100000 }) as Goal;
    useFinanceStore.getState().addGoal(goal);

    useFinanceStore.getState().addTransaction(buildTransaction({
      description: "Laptop savings 1",
      amount: 60000,
      type: "expense",
      category: "Savings",
      goalId: goal.id,
    }));
    useFinanceStore.getState().addTransaction(buildTransaction({
      description: "Laptop savings 2",
      amount: 40000,
      type: "expense",
      category: "Savings",
      goalId: goal.id,
    }));

    const metrics = calculateGoalMetrics(goal, useFinanceStore.getState().transactions);
    expect(metrics.saved).toBe(100000);
    expect(metrics.remaining).toBe(0);
    expect(metrics.percentage).toBe(100);
    expect(metrics.isCompleted).toBe(true);

    const status = getGoalStatus(metrics.percentage, metrics.isCompleted, metrics.isExpired);
    expect(status.label).toBe("Completed");
  });

  it("detects expired goals past target date", () => {
    const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const goal = buildGoal({ name: "Expired Goal", targetAmount: 50000, targetDate: pastDate }) as Goal;
    useFinanceStore.getState().addGoal(goal);

    const metrics = calculateGoalMetrics(goal, []);
    expect(metrics.isExpired).toBe(true);
    expect(metrics.isCompleted).toBe(false);

    const status = getGoalStatus(metrics.percentage, metrics.isCompleted, metrics.isExpired);
    expect(status.label).toBe("Expired");
  });

  it("identifies fastest growing goal", () => {
    const slowGoal = buildGoal({ name: "Slow Goal", targetAmount: 100000 });
    useFinanceStore.getState().addGoal(slowGoal);
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 10000, type: "expense", goalId: slowGoal.id }));

    const fastGoal = buildGoal({ name: "Fast Goal", targetAmount: 100000 });
    useFinanceStore.getState().addGoal(fastGoal);
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 90000, type: "expense", goalId: fastGoal.id }));

    const goals = useFinanceStore.getState().goals;
    const fastest = getGoalFastestGrowing(goals, useFinanceStore.getState().transactions);
    expect(fastest).not.toBeNull();
    if (fastest) {
      expect(fastest.goalName).toBe("Fast Goal");
    }
  });

  it("calculates total savings progress", () => {
    useFinanceStore.getState().addGoal(buildGoal({ name: "Goal A", targetAmount: 100000 }));
    useFinanceStore.getState().addGoal(buildGoal({ name: "Goal B", targetAmount: 200000 }));

    const goals = useFinanceStore.getState().goals;
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 30000, type: "expense", goalId: goals[0].id }));
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 50000, type: "expense", goalId: goals[1].id }));

    const totals = calculateGoalsTotal(goals, useFinanceStore.getState().transactions);
    expect(totals.totalSaved).toBe(80000);
    expect(totals.totalTarget).toBe(300000);
    expect(totals.pct).toBeCloseTo(26.67, 0);
  });

  it("supports full CRUD lifecycle", () => {
    expect(useFinanceStore.getState().goals).toHaveLength(0);

    useFinanceStore.getState().addGoal(buildGoal({ name: "New Goal" }));
    expect(useFinanceStore.getState().goals).toHaveLength(1);

    const g = useFinanceStore.getState().goals[0];
    useFinanceStore.getState().updateGoal(g.id, { name: "Updated Goal" });
    expect(useFinanceStore.getState().goals[0].name).toBe("Updated Goal");

    useFinanceStore.getState().deleteGoal(g.id);
    expect(useFinanceStore.getState().goals).toHaveLength(0);
  });

  it("provides completion forecast", () => {
    const goal = buildGoal({ name: "Forecast Goal", targetAmount: 120000, targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }) as Goal;
    useFinanceStore.getState().addGoal(goal);

    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 10000, type: "expense", goalId: goal.id }));

    const goals = useFinanceStore.getState().goals;
    const forecast = getGoalCompletionForecast(goals, useFinanceStore.getState().transactions);
    expect(forecast).toHaveLength(goals.length);
    expect(forecast[0].goalId).toBe(goal.id);
  });
});
