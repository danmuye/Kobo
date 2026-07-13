import type { Budget, Debt, GoalContributionEntry, SavingsGoal } from "@/types";
import { getFinanceService } from "./service-provider";
import {
  getBudgetPercentSpent,
  getBudgetRemaining,
  getBudgetOverspent,
  getBudgetDailyAllowance,
  getBudgetStatus,
  getBudgetPreviousPercent,
  getBudgetTrend,
  getBudgetPreviousPeriod,
  getGoalProgress,
} from "@/store/finance";

export function getBudgetProgress(budget: Budget) {
  return {
    pct: getBudgetPercentSpent(budget),
    remaining: getBudgetRemaining(budget),
    overspent: getBudgetOverspent(budget),
    dailyAllowance: getBudgetDailyAllowance(budget),
    status: getBudgetStatus(budget),
    previousPct: getBudgetPreviousPercent(budget),
    trend: getBudgetTrend(budget),
    previousPeriod: getBudgetPreviousPeriod(budget),
  };
}

export function getSavingsProgress(goal: SavingsGoal, contributions: GoalContributionEntry[]) {
  return getGoalProgress(goal, contributions);
}

export function getDebtTotals(debts: Debt[]) {
  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalOriginal = debts.reduce((sum, debt) => sum + debt.originalAmount, 0);
  const totalMin = debts.reduce((sum, debt) => sum + debt.minPayment, 0);
  return { totalDebt, totalOriginal, totalMin, paidOff: totalOriginal - totalDebt };
}

export { getFinanceService };

export function getAccounts() {
  return getFinanceService().accounts.list();
}

export function getTransactions() {
  return getFinanceService().transactions.list();
}

export function getBudgets() {
  return getFinanceService().budgets.list();
}

export function getGoals() {
  return getFinanceService().goals.list();
}

export function getDebts() {
  return getFinanceService().debts.list();
}

export { getBudgetRemaining, getBudgetPercentSpent, getBudgetOverspent, getBudgetDailyAllowance, getBudgetStatus, getBudgetPreviousPercent, getBudgetTrend, getBudgetPreviousPeriod, getGoalProgress } from "@/store/finance";
