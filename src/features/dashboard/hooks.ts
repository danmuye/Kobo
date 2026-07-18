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
  getAccountsHealth,
  calculateGoalsTotal,
  getMonthlyGoalSavings,
} from "@/store/finance";

export function useDashboardMetrics() {
  const transactions = useFinanceStore((s) => s.transactions);
  const accounts = useFinanceStore((s) => s.accounts);
  const goals = useFinanceStore((s) => s.goals);

  return useMemo(() => {
    const totalBalance = getCurrentBalance(accounts, transactions);
    const availableBalance = getAvailableBalance(accounts, transactions);
    const totalIncome = getTotalIncome(transactions);
    const totalExpenses = getTotalExpenses(transactions);
    const netCashFlow = getNetCashFlow(transactions);
    const lastTransactionDate = getLastTransactionDate(transactions);
    const { income, expenses, savings } = getMonthlySummary(transactions);
    const monthlyChart = getMonthlyChart(transactions);
    const categoryData = getCategoryBreakdown(transactions);
    const cashFlow = getCashFlow(monthlyChart);
    const savingsProgress = calculateGoalsTotal(goals, transactions);
    const monthlySavings = getMonthlyGoalSavings(goals, transactions);
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
      totalSaved: savingsProgress.totalSaved,
      totalTarget: savingsProgress.totalTarget,
      savingsProgress,
      monthlySavings,
      accountHealth,
      recentTransactions: transactions,
    };
  }, [accounts, transactions, goals]);
}
