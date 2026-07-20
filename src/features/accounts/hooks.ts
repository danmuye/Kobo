import { useMemo } from "react";
import {
  useFinanceStore,
  getCurrentBalance,
  getAvailableBalance,
  getTotalIncome,
  getTotalExpenses,
  getNetCashFlow,
  getLastTransactionDate,
  getMonthlyAccountSummary,
  getMonthlyAccountTrends,
  getAccountActivityTimeline,
  getAccountsHealth,
  getAccountsByType,
} from "@/store/finance";
import type {
  MonthlyAccountSummaryEntry,
  AccountTrend,
  AccountHealth,
  ActivityTimelineEntry,
} from "@/store/finance";
import type { AccountType, Account } from "@/types";
import { getFinanceService } from "@/services/service-provider";
import { computeBalances } from "@/services/account-balance";

export interface AccountSummary {
  currentBalance: number;
  availableBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  lastTransactionDate: string | null;
  monthlyAccountSummary: MonthlyAccountSummaryEntry[];
  trends: AccountTrend[];
  accountHealth: AccountHealth[];
  balanceMap: Map<string, number>;
}

export function useAccountsPage() {
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);

  const summary: AccountSummary = useMemo(
    () => ({
      currentBalance: getCurrentBalance(accounts, transactions),
      availableBalance: getAvailableBalance(accounts, transactions),
      totalIncome: getTotalIncome(transactions),
      totalExpenses: getTotalExpenses(transactions),
      netCashFlow: getNetCashFlow(transactions),
      lastTransactionDate: getLastTransactionDate(transactions),
      monthlyAccountSummary: getMonthlyAccountSummary(accounts, transactions),
      trends: getMonthlyAccountTrends(accounts, transactions),
      accountHealth: getAccountsHealth(accounts, transactions),
      balanceMap: computeBalances(accounts, transactions),
    }),
    [accounts, transactions],
  );

  const svc = getFinanceService();

  return {
    accounts,
    summary,
    addAccount: (data: Omit<Account, "id">) => svc.accounts.create(data),
    updateAccount: (id: string, data: Partial<Account>) => svc.accounts.update(id, data),
    deleteAccount: (id: string) => svc.accounts.delete(id),
  };
}

export function useFilteredAccounts(filterType?: AccountType | AccountType[]) {
  const accounts = useFinanceStore((s) => s.accounts);

  return useMemo(() => {
    if (!filterType) return accounts;
    const types = Array.isArray(filterType) ? filterType : [filterType];
    return getAccountsByType(accounts, types);
  }, [accounts, filterType]);
}

export function useMonthlySummaryMap(summary: AccountSummary) {
  return useMemo(() => {
    const map = new Map<string, MonthlyAccountSummaryEntry>();
    for (const entry of summary.monthlyAccountSummary) {
      map.set(entry.accountName, entry);
    }
    return map;
  }, [summary.monthlyAccountSummary]);
}

export function useAccountActivityTimeline(accountName: string, limit = 10) {
  const transactions = useFinanceStore((s) => s.transactions);
  return useMemo(
    () => getAccountActivityTimeline(accountName, transactions, limit),
    [accountName, transactions, limit],
  );
}
