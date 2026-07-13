import { useMemo } from "react";
import { useFinanceStore } from "@/store/finance";
import { getSavingsProgress } from "@/services/finance";
import { getFinanceService } from "@/services/service-provider";
import type { SavingsGoal, GoalContributionEntry } from "@/types";

export function useGoalsPage() {
  const goals = useFinanceStore((s) => s.goals);
  const goalContributions = useFinanceStore((s) => s.goalContributions);
  const goalMilestones = useFinanceStore((s) => s.goalMilestones);

  const goalsWithProgress = useMemo(
    () => goals.map((goal) => ({ ...goal, progress: getSavingsProgress(goal, goalContributions) })),
    [goals, goalContributions],
  );

  const svc = getFinanceService();

  return {
    goals: goalsWithProgress,
    goalContributions,
    goalMilestones,
    addGoal: (data: Omit<SavingsGoal, "id">) => svc.goals.create(data),
    updateGoal: (id: string, data: Partial<SavingsGoal>) => svc.goals.update(id, data),
    deleteGoal: (id: string) => svc.goals.delete(id),
    addGoalContribution: (data: Omit<GoalContributionEntry, "id">) => svc.goalContributions.create(data),
    updateGoalContribution: (id: string, data: Partial<GoalContributionEntry>) => svc.goalContributions.update(id, data),
    deleteGoalContribution: (id: string) => svc.goalContributions.delete(id),
  };
}
