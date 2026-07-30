import { useMemo, useCallback } from "react";
import { useFinanceStore, calculateGoalMetrics, type GoalMetrics } from "@/store/finance";
import { getFinanceService } from "@/services/service-provider";
import { getGoalAnalytics, type GoalAnalytics } from "@/services/goal-insights";
import type { Goal } from "@/types";

export interface GoalWithMetrics extends Goal {
  metrics: GoalMetrics;
}

export interface GoalWithAnalytics extends GoalWithMetrics {
  analytics: GoalAnalytics;
}

export function useGoalsPage() {
  const goals = useFinanceStore((s) => s.goals);
  const transactions = useFinanceStore((s) => s.transactions);

  const goalsWithMetrics: GoalWithMetrics[] = useMemo(
    () => goals.map((goal) => ({
      ...goal,
      metrics: calculateGoalMetrics(goal, transactions),
    })),
    [goals, transactions],
  );

  const svc = getFinanceService();

  const addGoal = useCallback((data: Omit<Goal, "id">) => svc.goals.create(data), [svc]);
  const updateGoal = useCallback((id: string, data: Partial<Goal>) => svc.goals.update(id, data), [svc]);
  const deleteGoal = useCallback((id: string) => svc.goals.delete(id), [svc]);

  return {
    goals: goalsWithMetrics,
    addGoal,
    updateGoal,
    deleteGoal,
  };
}

export function useGoalAnalytics(goalId: string | null): GoalAnalytics | null {
  const goals = useFinanceStore((s) => s.goals);
  const transactions = useFinanceStore((s) => s.transactions);

  return useMemo(() => {
    if (!goalId) return null;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return null;

    return getGoalAnalytics(goal, transactions);
  }, [goalId, goals, transactions]);
}

export function useGoalMetrics(goalId: string | null): GoalMetrics | null {
  const goals = useFinanceStore((s) => s.goals);
  const transactions = useFinanceStore((s) => s.transactions);

  return useMemo(() => {
    if (!goalId) return null;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return null;

    return calculateGoalMetrics(goal, transactions);
  }, [goalId, goals, transactions]);
}
