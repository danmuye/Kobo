import { describe, it, expect, beforeEach } from "vitest";
import {
  getDebtStatus,
  calculateDebtMetrics,
  calculateDebtTotals,
  getMatchingDebtTransactions,
  migrateDebt,
} from "./debt-matching";
import { buildDebt, buildTransaction, resetCounter } from "@/test/factories";

beforeEach(() => resetCounter());

describe("getDebtStatus", () => {
  it("returns paid-off when paid", () => {
    expect(getDebtStatus(100, true, false)).toMatchObject({ value: "paid-off" });
  });

  it("returns overdue when overdue", () => {
    expect(getDebtStatus(50, false, true)).toMatchObject({ value: "overdue" });
  });

  it("returns behind at 90%+", () => {
    expect(getDebtStatus(95, false, false)).toMatchObject({ value: "behind" });
  });

  it("returns behind at 50-89%", () => {
    expect(getDebtStatus(60, false, false)).toMatchObject({ value: "behind" });
  });

  it("returns on-track at 10-49%", () => {
    expect(getDebtStatus(30, false, false)).toMatchObject({ value: "on-track" });
  });

  it("returns critical below 10%", () => {
    expect(getDebtStatus(5, false, false)).toMatchObject({ value: "critical" });
  });
});

describe("getMatchingDebtTransactions", () => {
  it("returns transactions linked by debtId", () => {
    const later = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
    const debt = buildDebt({ id: "d1", startDate: "2024-01-01" });
    const txs = [
      buildTransaction({ debtId: "d1", amount: 5000, type: "expense", date: later }),
      buildTransaction({ debtId: "d1", amount: 3000, type: "expense", date: later }),
    ];
    expect(getMatchingDebtTransactions(debt, txs)).toHaveLength(2);
  });

  it("filters transactions before start date", () => {
    const debt = buildDebt({ id: "d1", startDate: "2024-06-01" });
    const txs = [
      buildTransaction({ debtId: "d1", amount: 5000, date: "2024-05-15T10:00:00Z" }),
    ];
    expect(getMatchingDebtTransactions(debt, txs)).toHaveLength(0);
  });

  it("filters income transactions", () => {
    const debt = buildDebt({ id: "d1" });
    const txs = [
      buildTransaction({ debtId: "d1", amount: 5000, type: "income", date: "2024-06-10T10:00:00Z" }),
    ];
    expect(getMatchingDebtTransactions(debt, txs)).toHaveLength(0);
  });

  it("filters transfers when includeTransfers is false", () => {
    const debt = buildDebt({ id: "d1" });
    const txs = [
      buildTransaction({ debtId: "d1", amount: 5000, type: "transfer", date: "2024-06-10T10:00:00Z" }),
    ];
    expect(getMatchingDebtTransactions(debt, txs)).toHaveLength(0);
  });
});

describe("calculateDebtMetrics", () => {
  it("returns zeros when no transactions", () => {
    const debt = buildDebt({ id: "d1", originalAmount: 500000 });
    const metrics = calculateDebtMetrics(debt, [], new Date("2024-06-15"));
    expect(metrics.amountPaid).toBe(0);
    expect(metrics.remainingBalance).toBe(500000);
    expect(metrics.percentagePaid).toBe(0);
    expect(metrics.paymentCount).toBe(0);
    expect(metrics.isPaidOff).toBe(false);
    expect(metrics.isOverdue).toBe(false);
  });

  it("calculates amount paid from transactions", () => {
    const later = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
    const debt = buildDebt({ id: "d1", originalAmount: 500000, startDate: "2024-01-01" });
    const txs = [
      buildTransaction({ debtId: "d1", amount: 50000, type: "expense", date: later }),
      buildTransaction({ debtId: "d1", amount: 30000, type: "expense", date: later }),
    ];
    const metrics = calculateDebtMetrics(debt, txs, new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
    expect(metrics.amountPaid).toBe(80000);
    expect(metrics.remainingBalance).toBe(420000);
    expect(metrics.percentagePaid).toBeCloseTo(16, 0);
    expect(metrics.paymentCount).toBe(2);
  });

  it("marks as paid off when fully paid", () => {
    const later = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
    const debt = buildDebt({ id: "d1", originalAmount: 50000, startDate: "2024-01-01" });
    const txs = [
      buildTransaction({ debtId: "d1", amount: 50000, type: "expense", date: later }),
    ];
    const metrics = calculateDebtMetrics(debt, txs, new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
    expect(metrics.isPaidOff).toBe(true);
    expect(metrics.remainingBalance).toBe(0);
  });

  it("marks as overdue when past due date and not paid", () => {
    const debt = buildDebt({
      id: "d1",
      originalAmount: 500000,
      dueDate: "2024-01-01",
    });
    const metrics = calculateDebtMetrics(debt, [], new Date("2024-06-15"));
    expect(metrics.isOverdue).toBe(true);
    expect(metrics.daysUntilDue).toBeLessThan(0);
  });

  it("computes monthly paid", () => {
    const debt = buildDebt({
      id: "d1",
      originalAmount: 500000,
      startDate: "2024-01-01",
    });
    const txs = [
      buildTransaction({ debtId: "d1", amount: 30000, type: "expense", date: "2024-06-10T10:00:00Z" }),
    ];
    const metrics = calculateDebtMetrics(debt, txs, new Date("2024-06-15"));
    expect(metrics.monthlyPaid).toBeGreaterThan(0);
  });
});

describe("calculateDebtTotals", () => {
  it("returns zeros for empty debts", () => {
    const result = calculateDebtTotals([], []);
    expect(result.totalOriginal).toBe(0);
    expect(result.totalPaid).toBe(0);
    expect(result.totalRemaining).toBe(0);
    expect(result.count).toBe(0);
  });

  it("aggregates across debts", () => {
    const debts = [
      buildDebt({ id: "d1", originalAmount: 500000, minimumPayment: 10000 }),
      buildDebt({ id: "d2", originalAmount: 200000, minimumPayment: 5000 }),
    ];
    const txs = [
      buildTransaction({ debtId: "d1", amount: 50000, type: "expense" }),
    ];
    const result = calculateDebtTotals(debts, txs);
    expect(result.totalOriginal).toBe(700000);
    expect(result.totalPaid).toBe(50000);
    expect(result.totalMin).toBe(15000);
    expect(result.count).toBe(2);
  });
});

describe("migrateDebt", () => {
  it("fills missing fields with defaults", () => {
    const result = migrateDebt({});
    expect(result.debtType).toBe("Loan");
    expect(result.repaymentType).toBe("Fixed");
    expect(result.color).toBe("#ef4444");
    expect(result.icon).toBe("credit-card");
  });

  it("preserves existing values", () => {
    const result = migrateDebt({ id: "d1", name: "Car Loan", debtType: "Mortgage" });
    expect(result.id).toBe("d1");
    expect(result.name).toBe("Car Loan");
    expect(result.debtType).toBe("Mortgage");
  });
});
