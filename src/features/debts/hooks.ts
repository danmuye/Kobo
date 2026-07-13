import { useMemo } from "react";
import { useFinanceStore } from "@/store/finance";
import { getDebtTotals } from "@/services/finance";
import { getFinanceService } from "@/services/service-provider";
import type { Debt } from "@/types";

export function useDebtsPage() {
  const debts = useFinanceStore((s) => s.debts);

  const debtSummary = useMemo(() => getDebtTotals(debts), [debts]);

  const svc = getFinanceService();

  return {
    debts,
    debtSummary,
    addDebt: (data: Omit<Debt, "id">) => svc.debts.create(data),
    updateDebt: (id: string, data: Partial<Debt>) => svc.debts.update(id, data),
    deleteDebt: (id: string) => svc.debts.delete(id),
  };
}
