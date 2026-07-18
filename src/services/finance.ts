import type { Debt, Goal, Transaction } from "@/types";
import { useFinanceStore, calculateGoalMetrics } from "@/store/finance";
import { calculateDebtMetrics } from "@/services/debt-matching";

export function getDebtTotals(debts: Debt[], transactions: Transaction[]) {
  const safe = Array.isArray(debts) ? debts : [];
  let totalOriginal = 0;
  let totalPaid = 0;
  let totalMin = 0;
  for (const debt of safe) {
    const m = calculateDebtMetrics(debt, transactions);
    totalOriginal += debt.originalAmount;
    totalPaid += m.amountPaid;
    totalMin += debt.minimumPayment;
  }
  return { totalDebt: totalOriginal - totalPaid, totalOriginal, totalMin, paidOff: totalPaid };
}

export function getAccounts() {
  return useFinanceStore.getState().accounts;
}

export function getTransactions() {
  return useFinanceStore.getState().transactions;
}

export function getGoals() {
  return useFinanceStore.getState().goals;
}

export function getDebts() {
  return useFinanceStore.getState().debts;
}

export function getSavingsProgress(goal: Goal, transactions: Transaction[]) {
  return calculateGoalMetrics(goal, transactions);
}

export function getDebtPaidPercent(debt: Debt, transactions: Transaction[]) {
  if (debt.originalAmount === 0) return 0;
  const m = calculateDebtMetrics(debt, transactions);
  return m.percentagePaid;
}
