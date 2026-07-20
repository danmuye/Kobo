import { describe, it, expect, beforeEach } from "vitest";
import {
  archiveGoalMetrics,
  getContributionTrend,
  getMonthlyProgress,
  getGoalAnalytics,
  suggestGoalTags,
  suggestGoalsForTransaction,
} from "./goal-insights";
import { buildGoal, buildTransaction, resetCounter } from "@/test/factories";

beforeEach(() => resetCounter());

describe("archiveGoalMetrics", () => {
  it("returns history entry with metrics", () => {
    const goal = buildGoal({ id: "g1", name: "Vacation", targetAmount: 100000 });
    const txs = [
      buildTransaction({ goalId: "g1", amount: 50000, date: "2024-06-10T10:00:00Z" }),
    ];
    const result = archiveGoalMetrics(goal, txs);
    expect(result.goalName).toBe("Vacation");
    expect(result.targetAmount).toBe(100000);
    expect(result.saved).toBe(50000);
    expect(result.percentage).toBe(50);
    expect(result.goalId).toBe("g1");
  });
});

describe("getContributionTrend", () => {
  it("returns sorted contribution points", () => {
    const goal = buildGoal({ id: "g1" });
    const txs = [
      buildTransaction({ goalId: "g1", amount: 2000, date: "2024-06-10T10:00:00Z" }),
      buildTransaction({ goalId: "g1", amount: 3000, date: "2024-06-05T10:00:00Z" }),
    ];
    const trend = getContributionTrend(goal, txs);
    expect(trend).toHaveLength(2);
    expect(trend[0].date).toBe("2024-06-05T10:00:00Z");
    expect(trend[0].cumulative).toBe(3000);
    expect(trend[1].cumulative).toBe(5000);
  });
});

describe("getMonthlyProgress", () => {
  it("returns progress for each month", () => {
    const goal = buildGoal({ id: "g1", targetAmount: 100000 });
    const result = getMonthlyProgress(goal, [], 3);
    expect(result).toHaveLength(3);
    expect(result[0].target).toBe(100000);
    expect(result[0].saved).toBe(0);
  });
});

describe("getGoalAnalytics", () => {
  it("returns analytics for a goal", () => {
    const goal = buildGoal({ id: "g1", targetAmount: 100000 });
    const txs = [
      buildTransaction({ goalId: "g1", amount: 50000, date: "2024-06-10T10:00:00Z" }),
    ];
    const result = getGoalAnalytics(goal, txs);
    expect(result.contributionTrend).toHaveLength(1);
    expect(result.averageContribution).toBe(50000);
    expect(result.largestContribution).toBe(50000);
    expect(result.savingsHeatmap).toHaveLength(7);
  });
});

describe("suggestGoalTags", () => {
  it("maps categories to tags", () => {
    expect(suggestGoalTags(["Rent"])).toEqual(["Rent"]);
    expect(suggestGoalTags(["Medical", "Travel"])).toEqual(["Medical", "Vacation"]);
  });

  it("returns empty array for unknown categories", () => {
    expect(suggestGoalTags(["Unknown"])).toEqual([]);
  });
});

describe("suggestGoalsForTransaction", () => {
  it("returns empty when no incomplete goals", () => {
    const goal = buildGoal({
      id: "g1",
      targetAmount: 100000,
      targetDate: "2099-12-31",
      startDate: "2024-01-01",
    });
    const tx = buildTransaction({ amount: 5000 });
    const result = suggestGoalsForTransaction(tx, [goal], []);
    expect(result).toHaveLength(1);
    expect(result[0].wouldAdd).toBe(5000);
  });
});
