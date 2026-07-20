import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalCard } from "../GoalCard";
import { useFinanceStore } from "@/store/finance";
import { buildGoal, resetCounter } from "@/test/factories";
import { renderWithProviders } from "@/test/test-utils";
import type { GoalMetrics } from "@/services/goal-matching";

beforeEach(() => {
  resetCounter();
});

function makeGoalMetrics(overrides: Partial<GoalMetrics> = {}): GoalMetrics {
  return {
    saved: 50000,
    remaining: 50000,
    percentage: 50,
    daysRemaining: 180,
    transactionCount: 3,
    isCompleted: false,
    isOverTarget: false,
    isExpired: false,
    completionDate: null,
    estimatedCompletionDate: null,
    averageMonthlyRate: 10000,
    averageDailySaving: 333.33,
    requiredDailySaving: 277.78,
    requiredWeeklySaving: 1944.44,
    requiredMonthlySaving: 8333.33,
    healthScore: 65,
    contributionFrequency: 2,
    savingsConsistency: 60,
    largestContribution: 30000,
    averageContribution: 16666.67,
    daysElapsed: 150,
    ...overrides,
  };
}

describe("GoalCard", () => {
  it("renders goal name and target", () => {
    const goal = { ...buildGoal({ name: "Vacation", targetAmount: 100000 }), metrics: makeGoalMetrics() };
    renderWithProviders(<GoalCard goal={goal} />);
    expect(screen.getByText("Vacation")).toBeInTheDocument();
    expect(screen.getByText(/Target ₦100,000/)).toBeInTheDocument();
  });

  it("renders status badge", () => {
    const goal = { ...buildGoal({ name: "Test" }), metrics: makeGoalMetrics() };
    renderWithProviders(<GoalCard goal={goal} />);
    expect(screen.getByText("On Track")).toBeInTheDocument();
  });

  it("shows health score", () => {
    const goal = { ...buildGoal({ name: "Test" }), metrics: makeGoalMetrics({ healthScore: 80 }) };
    renderWithProviders(<GoalCard goal={goal} />);
    expect(screen.getByTitle(/Health score/)).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
  });

  it("calls onEdit when edit is clicked", async () => {
    const onEdit = vi.fn();
    const goal = { ...buildGoal({ name: "Editable" }), metrics: makeGoalMetrics() };
    renderWithProviders(<GoalCard goal={goal} onEdit={onEdit} />);
    await userEvent.click(screen.getByLabelText("Goal actions"));
    await userEvent.click(screen.getByText("Edit Goal"));
    expect(onEdit).toHaveBeenCalledWith(goal);
  });

  it("calls onDelete when delete is clicked", async () => {
    const onDelete = vi.fn();
    const goal = { ...buildGoal({ name: "Deletable" }), metrics: makeGoalMetrics() };
    renderWithProviders(<GoalCard goal={goal} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText("Goal actions"));
    await userEvent.click(screen.getByText("Delete Goal"));
    expect(onDelete).toHaveBeenCalledWith(goal);
  });

  it("calls onAddContribution when add button is clicked", async () => {
    const onAddContribution = vi.fn();
    const goal = { ...buildGoal({ name: "Contributable" }), metrics: makeGoalMetrics() };
    renderWithProviders(<GoalCard goal={goal} onAddContribution={onAddContribution} />);
    await userEvent.click(screen.getByText("Add Contribution"));
    expect(onAddContribution).toHaveBeenCalledWith(goal);
  });

  it("renders progress bar with correct percentage", () => {
    const goal = { ...buildGoal({ name: "Test" }), metrics: makeGoalMetrics({ percentage: 75 }) };
    renderWithProviders(<GoalCard goal={goal} />);
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "75");
  });

  it("shows expired styling for expired goals", () => {
    const goal = { ...buildGoal({ name: "Expired" }), metrics: makeGoalMetrics({ isExpired: true, percentage: 30 }) };
    renderWithProviders(<GoalCard goal={goal} />);
    const matches = screen.getAllByText("Expired");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("shows completed status", () => {
    const goal = { ...buildGoal({ name: "Done" }), metrics: makeGoalMetrics({ isCompleted: true, percentage: 100 }) };
    renderWithProviders(<GoalCard goal={goal} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});
