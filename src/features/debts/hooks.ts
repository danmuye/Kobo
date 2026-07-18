import { useMemo, useCallback } from "react";
import { useFinanceStore, calculateDebtMetrics, calculateDebtTotals } from "@/store/finance";
import { getFinanceService } from "@/services/service-provider";
import type { Debt } from "@/types";

const debtMetricsCache = new Map<string, ReturnType<typeof calculateDebtMetrics>>();

export function useDebtsPage() {
  const debts = useFinanceStore((s) => s.debts);
  const transactions = useFinanceStore((s) => s.transactions);

  const debtsWithMetrics = useMemo(
    () => debts.map((d) => {
      const cached = debtMetricsCache.get(d.id);
      if (cached) return { ...d, metrics: cached };
      const metrics = calculateDebtMetrics(d, transactions);
      debtMetricsCache.set(d.id, metrics);
      return { ...d, metrics };
    }),
    [debts, transactions],
  );

  const debtSummary = useMemo(() => calculateDebtTotals(debts, transactions), [debts, transactions]);

  const svc = getFinanceService();

  const addDebt = useCallback((data: Omit<Debt, "id">) => svc.debts.create(data), [svc]);
  const updateDebt = useCallback((id: string, data: Partial<Debt>) => {
    debtMetricsCache.delete(id);
    return svc.debts.update(id, data);
  }, [svc]);
  const deleteDebt = useCallback((id: string) => {
    debtMetricsCache.delete(id);
    return svc.debts.delete(id);
  }, [svc]);

  return {
    debts: debtsWithMetrics,
    debtSummary,
    addDebt,
    updateDebt,
    deleteDebt,
  };
}
