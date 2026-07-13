import { useMemo } from "react";
import {
  useFinanceStore,
  getCurrentBalance,
  getAvailableBalance,
  getTotalIncome,
  getTotalExpenses,
  getNetCashFlow,
  getLastTransactionDate,
  getMonthlySummary,
  getMonthlyChart,
  getCategoryBreakdown,
  getCashFlow,
  getTotalSaved,
  getTotalTarget,
  getTotalSavingsProgress,
  getMonthlyGoalContributions,
  getAccountsHealth,
} from "@/store/finance";

export function useDashboardMetrics() {
  const transactions = useFinanceStore((s) => s.transactions);
  const accounts = useFinanceStore((s) => s.accounts);
  const goals = useFinanceStore((s) => s.goals);
  const goalContributions = useFinanceStore((s) => s.goalContributions);

  return useMemo(() => {
    const totalBalance = getCurrentBalance(accounts);
    const availableBalance = getAvailableBalance(accounts, transactions);
    const totalIncome = getTotalIncome(transactions);
    const totalExpenses = getTotalExpenses(transactions);
    const netCashFlow = getNetCashFlow(transactions);
    const lastTransactionDate = getLastTransactionDate(transactions);
    const { income, expenses, savings } = getMonthlySummary(transactions);
    const monthlyChart = getMonthlyChart(transactions);
    const categoryData = getCategoryBreakdown(transactions);
    const cashFlow = getCashFlow(monthlyChart);
    const totalSaved = getTotalSaved(goals);
    const totalTarget = getTotalTarget(goals);
    const savingsProgress = getTotalSavingsProgress(goals);
    const monthlySavings = getMonthlyGoalContributions(goalContributions);
    const accountHealth = getAccountsHealth(accounts, transactions);
    return {
      totalBalance,
      availableBalance,
      totalIncome,
      totalExpenses,
      netCashFlow,
      lastTransactionDate,
      income,
      expenses,
      savings,
      monthlyChart,
      categoryData,
      cashFlow,
      totalSaved,
      totalTarget,
      savingsProgress,
      monthlySavings,
      accountHealth,
      recentTransactions: transactions,
    };
  }, [accounts, transactions, goals, goalContributions]);
}
