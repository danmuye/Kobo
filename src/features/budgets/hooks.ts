import { useMemo } from "react";
import { useFinanceStore } from "@/store/finance";
import { getBudgetProgress } from "@/services/finance";
import { getFinanceService } from "@/services/service-provider";
import type { Budget } from "@/types";

export function useBudgetsPage() {
  const budgets = useFinanceStore((s) => s.budgets);

  const budgetsWithProgress = useMemo(
    () => budgets.map((budget) => ({ ...budget, progress: getBudgetProgress(budget) })),
    [budgets],
  );

  const svc = getFinanceService();

  return {
    budgets: budgetsWithProgress,
    addBudget: (data: Omit<Budget, "id">) => svc.budgets.create(data),
    updateBudget: (id: string, data: Partial<Budget>) => svc.budgets.update(id, data),
    deleteBudget: (id: string) => svc.budgets.delete(id),
  };
}
