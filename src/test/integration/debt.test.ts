import { describe, it, expect, beforeEach } from "vitest";
import { useFinanceStore } from "@/store/finance";
import { buildDebt, buildTransaction, buildAccount, resetCounter } from "@/test/factories";
import { calculateDebtMetrics, getDebtStatus, calculateDebtTotals } from "@/services/debt-matching";
import { calculateDebtInsights } from "@/services/debt-insights";
import type { Debt } from "@/types";

beforeEach(() => {
  resetCounter();
  useFinanceStore.setState({
    transactions: [],
    budgets: [],
    budgetHistory: [],
    goals: [],
    goalHistory: [],
    debts: [],
    debtHistory: [],
    accounts: [buildAccount({ name: "Main", openingBalance: 500000 })],
  });
});

describe("Debts workflow", () => {
  it("creates a debt", () => {
    useFinanceStore.getState().addDebt(buildDebt({
      name: "Car Loan",
      lender: "GTBank",
      originalAmount: 2000000,
      interestRate: 15,
    }));

    const debts = useFinanceStore.getState().debts;
    expect(debts).toHaveLength(1);
    expect(debts[0].name).toBe("Car Loan");
    expect(debts[0].originalAmount).toBe(2000000);
  });

  it("records a payment and updates metrics", () => {
    const debt = buildDebt({ name: "Personal Loan", originalAmount: 500000 }) as Debt;
    useFinanceStore.getState().addDebt(debt);

    useFinanceStore.getState().addTransaction(buildTransaction({
      description: "Loan payment 1",
      amount: 50000,
      type: "expense",
      category: "Debt Payment",
      debtId: debt.id,
    }));

    const metrics = calculateDebtMetrics(debt, useFinanceStore.getState().transactions);
    expect(metrics.amountPaid).toBe(50000);
    expect(metrics.remainingBalance).toBe(450000);
    expect(metrics.percentagePaid).toBe(10);
    expect(metrics.paymentCount).toBe(1);
  });

  it("closes a debt when fully paid", () => {
    const debt = buildDebt({ name: "Small Debt", originalAmount: 100000 }) as Debt;
    useFinanceStore.getState().addDebt(debt);

    useFinanceStore.getState().addTransaction(buildTransaction({
      description: "Full payment",
      amount: 100000,
      type: "expense",
      category: "Debt Payment",
      debtId: debt.id,
    }));

    const metrics = calculateDebtMetrics(debt, useFinanceStore.getState().transactions);
    expect(metrics.isPaidOff).toBe(true);
    expect(metrics.remainingBalance).toBe(0);
    expect(metrics.percentagePaid).toBe(100);

    const status = getDebtStatus(metrics.percentagePaid, metrics.isPaidOff, metrics.isOverdue);
    expect(status.label).toBe("Paid Off");
  });

  it("detects overdue debt", () => {
    const pastDue = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const debt = buildDebt({ name: "Overdue Loan", originalAmount: 300000, dueDate: pastDue }) as Debt;
    useFinanceStore.getState().addDebt(debt);

    const metrics = calculateDebtMetrics(debt, []);
    expect(metrics.isOverdue).toBe(true);
    expect(metrics.isPaidOff).toBe(false);

    const status = getDebtStatus(metrics.percentagePaid, metrics.isPaidOff, metrics.isOverdue);
    expect(status.label).toBe("Overdue");
  });

  it("calculates debt insights and health score", () => {
    const debt = buildDebt({ name: "Health Check Debt", originalAmount: 600000, minimumPayment: 15000 }) as Debt;
    useFinanceStore.getState().addDebt(debt);

    useFinanceStore.getState().addTransaction(buildTransaction({
      amount: 30000,
      type: "expense",
      debtId: debt.id,
    }));

    const insights = calculateDebtInsights(debt, useFinanceStore.getState().transactions);
    expect(insights.debtHealthScore).toBeGreaterThanOrEqual(0);
    expect(insights.debtHealthScore).toBeLessThanOrEqual(100);
    expect(insights.estimatedPayoffDate).toBeDefined();
    expect(typeof insights.totalInterestEstimate).toBe("number");
  });

  it("calculates total debt portfolio", () => {
    useFinanceStore.getState().addDebt(buildDebt({ name: "Debt A", originalAmount: 500000 }));
    useFinanceStore.getState().addDebt(buildDebt({ name: "Debt B", originalAmount: 300000 }));

    const debts = useFinanceStore.getState().debts;

    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 100000, type: "expense", debtId: debts[0].id }));
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 50000, type: "expense", debtId: debts[1].id }));

    const totals = calculateDebtTotals(debts, useFinanceStore.getState().transactions);
    expect(totals.totalOriginal).toBe(800000);
    expect(totals.totalPaid).toBe(150000);
    expect(totals.totalRemaining).toBe(650000);
    expect(totals.count).toBe(2);
  });

  it("supports full CRUD lifecycle", () => {
    expect(useFinanceStore.getState().debts).toHaveLength(0);

    useFinanceStore.getState().addDebt(buildDebt({ name: "New Debt" }));
    expect(useFinanceStore.getState().debts).toHaveLength(1);

    const d = useFinanceStore.getState().debts[0];
    useFinanceStore.getState().updateDebt(d.id, { name: "Updated Debt" });
    expect(useFinanceStore.getState().debts[0].name).toBe("Updated Debt");

    useFinanceStore.getState().deleteDebt(d.id);
    expect(useFinanceStore.getState().debts).toHaveLength(0);
  });
});
