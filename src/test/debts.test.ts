import { describe, expect, it, beforeEach } from "vitest";
import { calculateDebtMetrics, getMatchingDebtTransactions, calculateDebtTotals, getDebtStatus } from "@/services/debt-matching";
import { useFinanceStore } from "@/store/finance";
import type { Debt, Transaction } from "@/types";

const baseDebt: Debt = {
  id: "debt-1",
  name: "Test Loan",
  lender: "Test Bank",
  originalAmount: 500000,
  interestRate: 5,
  debtType: "Loan",
  repaymentType: "Fixed",
  minimumPayment: 25000,
  dueDate: new Date(new Date().getFullYear() + 1, 5, 1).toISOString(),
  startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString(),
  categories: [],
  accounts: [],
  wallets: [],
  tags: [],
  color: "#ef4444",
  icon: "credit-card",
  notes: "",
  includeTransfers: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function tx(overrides: Partial<Transaction> & { id: string }): Transaction {
  return {
    date: new Date().toISOString(),
    description: "Test payment",
    category: "Utilities",
    account: "Main",
    amount: 10000,
    type: "expense",
    tags: [],
    ...overrides,
  };
}

describe("debt-matching service", () => {
  describe("getMatchingDebtTransactions", () => {
    it("matches expense transactions to debts", () => {
      const transactions = [
        tx({ id: "1", type: "expense", amount: 25000 }),
        tx({ id: "2", type: "income", amount: 100000 }),
      ];
      const matched = getMatchingDebtTransactions(baseDebt, transactions);
      expect(matched).toHaveLength(1);
      expect(matched[0].id).toBe("1");
    });

    it("does not match income transactions", () => {
      const transactions = [tx({ id: "1", type: "income", amount: 50000 })];
      const matched = getMatchingDebtTransactions(baseDebt, transactions);
      expect(matched).toHaveLength(0);
    });

    it("includes transfers when includeTransfers is true", () => {
      const debt = { ...baseDebt, includeTransfers: true };
      const transactions = [tx({ id: "1", type: "transfer", amount: 30000 })];
      const matched = getMatchingDebtTransactions(debt, transactions);
      expect(matched).toHaveLength(1);
    });

    it("excludes transfers when includeTransfers is false", () => {
      const transactions = [tx({ id: "1", type: "transfer", amount: 30000 })];
      const matched = getMatchingDebtTransactions(baseDebt, transactions);
      expect(matched).toHaveLength(0);
    });

    it("filters by category when debt has categories", () => {
      const debt = { ...baseDebt, categories: ["Utilities", "Rent"] };
      const transactions = [
        tx({ id: "1", category: "Utilities", amount: 25000 }),
        tx({ id: "2", category: "Food & Dining", amount: 5000 }),
      ];
      const matched = getMatchingDebtTransactions(debt, transactions);
      expect(matched).toHaveLength(1);
      expect(matched[0].id).toBe("1");
    });

    it("filters by account when debt has accounts", () => {
      const debt = { ...baseDebt, accounts: ["Main"] };
      const transactions = [
        tx({ id: "1", account: "Main", amount: 25000 }),
        tx({ id: "2", account: "Savings", amount: 5000 }),
      ];
      const matched = getMatchingDebtTransactions(debt, transactions);
      expect(matched).toHaveLength(1);
      expect(matched[0].id).toBe("1");
    });

    it("filters by tag when debt has tags", () => {
      const debt = { ...baseDebt, tags: ["debt-payment"] };
      const transactions = [
        tx({ id: "1", tags: ["debt-payment"], amount: 25000 }),
        tx({ id: "2", tags: ["groceries"], amount: 5000 }),
      ];
      const matched = getMatchingDebtTransactions(debt, transactions);
      expect(matched).toHaveLength(1);
      expect(matched[0].id).toBe("1");
    });

    it("filters transactions before start date", () => {
      const debt = {
        ...baseDebt,
        startDate: "2025-06-01T00:00:00.000Z",
      };
      const transactions = [
        tx({ id: "1", date: "2025-07-01T00:00:00.000Z", amount: 25000 }),
        tx({ id: "2", date: "2025-01-01T00:00:00.000Z", amount: 5000 }),
      ];
      const matched = getMatchingDebtTransactions(debt, transactions);
      expect(matched).toHaveLength(1);
      expect(matched[0].id).toBe("1");
    });
  });

  describe("calculateDebtMetrics", () => {
    it("calculates amount paid correctly", () => {
      const transactions = [
        tx({ id: "1", amount: 25000 }),
        tx({ id: "2", amount: 15000 }),
      ];
      const metrics = calculateDebtMetrics(baseDebt, transactions);
      expect(metrics.amountPaid).toBe(40000);
      expect(metrics.remainingBalance).toBe(460000);
      expect(metrics.percentagePaid).toBeCloseTo(8, 1);
    });

    it("returns zero paid when no transactions match", () => {
      const metrics = calculateDebtMetrics({ ...baseDebt, categories: ["Nonexistent"] }, []);
      expect(metrics.amountPaid).toBe(0);
      expect(metrics.remainingBalance).toBe(500000);
      expect(metrics.percentagePaid).toBe(0);
      expect(metrics.paymentCount).toBe(0);
    });

    it("marks debt as paid off when enough payments made", () => {
      const transactions = [tx({ id: "1", amount: 500000 })];
      const metrics = calculateDebtMetrics(baseDebt, transactions);
      expect(metrics.isPaidOff).toBe(true);
      expect(metrics.remainingBalance).toBe(0);
      expect(metrics.percentagePaid).toBe(100);
    });

    it("marks debt as paid off when overpaid", () => {
      const transactions = [tx({ id: "1", amount: 600000 })];
      const metrics = calculateDebtMetrics(baseDebt, transactions);
      expect(metrics.isPaidOff).toBe(true);
      expect(metrics.remainingBalance).toBe(0);
    });

    it("detects overdue debts", () => {
      const debt = {
        ...baseDebt,
        startDate: "2020-01-01T00:00:00.000Z",
        dueDate: "2020-06-01T00:00:00.000Z",
      };
      const transactions: Transaction[] = [];
      const metrics = calculateDebtMetrics(debt, transactions, new Date("2025-01-01"));
      expect(metrics.isOverdue).toBe(true);
      expect(metrics.isPaidOff).toBe(false);
    });

    it("calculates correct payment count", () => {
      const transactions = [
        tx({ id: "1", amount: 10000 }),
        tx({ id: "2", amount: 20000 }),
        tx({ id: "3", amount: 30000 }),
      ];
      const metrics = calculateDebtMetrics(baseDebt, transactions);
      expect(metrics.paymentCount).toBe(3);
    });

    it("calculates monthly paid amount", () => {
      const debt = {
        ...baseDebt,
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const transactions = [tx({ id: "1", amount: 30000 })];
      const metrics = calculateDebtMetrics(debt, transactions);
      expect(metrics.monthlyPaid).toBeGreaterThan(0);
      expect(metrics.paymentCount).toBe(1);
    });

    it("calculates correct days until due", () => {
      const debt = {
        ...baseDebt,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const metrics = calculateDebtMetrics(debt, [], new Date());
      expect(metrics.daysUntilDue).toBeGreaterThan(25);
      expect(metrics.daysUntilDue).toBeLessThan(35);
    });
  });

  describe("calculateDebtTotals", () => {
    it("aggregates multiple debts correctly", () => {
      const debtA = { ...baseDebt, id: "a", originalAmount: 500000, minimumPayment: 25000 };
      const debtB = { ...baseDebt, id: "b", originalAmount: 300000, minimumPayment: 15000 };
      const transactions = [
        tx({ id: "1", amount: 50000 }),
        tx({ id: "2", amount: 30000 }),
      ];
      const totals = calculateDebtTotals([debtA, debtB], transactions);
      expect(totals.totalOriginal).toBe(800000);
      expect(totals.totalPaid).toBe(160000);
      expect(totals.totalRemaining).toBe(640000);
      expect(totals.totalMin).toBe(40000);
      expect(totals.count).toBe(2);
    });
  });

  describe("getDebtStatus", () => {
    it("returns paid-off when isPaidOff is true", () => {
      const status = getDebtStatus(100, true, false);
      expect(status.label).toBe("Paid Off");
      expect(status.value).toBe("paid-off");
    });

    it("returns overdue when isOverdue is true", () => {
      const status = getDebtStatus(50, false, true);
      expect(status.label).toBe("Overdue");
      expect(status.value).toBe("overdue");
    });

    it("returns on-track for low paid percentage", () => {
      const status = getDebtStatus(5, false, false);
      expect(status.value).toBe("critical");
    });

    it("returns behind for mid paid percentage", () => {
      const status = getDebtStatus(60, false, false);
      expect(status.value).toBe("behind");
    });
  });
});

describe("debt store integration", () => {
  beforeEach(() => {
    useFinanceStore.setState({
      transactions: [],
      budgets: [],
      budgetHistory: [],
      goals: [],
      goalHistory: [],
      debts: [],
      accounts: [],
    });
  });

  it("adds a debt and returns it in state", () => {
    const store = useFinanceStore.getState();
    store.addDebt({ ...baseDebt, id: undefined });
    const debts = useFinanceStore.getState().debts;
    expect(debts).toHaveLength(1);
    expect(debts[0].name).toBe("Test Loan");
  });

  it("deletes a debt without affecting transactions", () => {
    const store = useFinanceStore.getState();
    store.addTransaction(tx({ id: "tx-1" }));
    store.addDebt({ ...baseDebt, id: "d-1" });
    expect(useFinanceStore.getState().debts).toHaveLength(1);
    expect(useFinanceStore.getState().transactions).toHaveLength(1);

    useFinanceStore.getState().deleteDebt("d-1");
    expect(useFinanceStore.getState().debts).toHaveLength(0);
    expect(useFinanceStore.getState().transactions).toHaveLength(1);
  });

  it("updating a debt triggers recalculation", () => {
    const store = useFinanceStore.getState();
    store.addDebt({ ...baseDebt, id: "d-1" });
    store.updateDebt("d-1", { originalAmount: 100000 });

    const debt = useFinanceStore.getState().debts[0];
    expect(debt.originalAmount).toBe(100000);
  });

  it("adding a transaction updates debt metrics dynamically", () => {
    const store = useFinanceStore.getState();
    store.addDebt({ ...baseDebt, id: "d-1", categories: ["Utilities"] });

    store.addTransaction(tx({ id: "tx-1", category: "Utilities", amount: 50000 }));
    store.addTransaction(tx({ id: "tx-2", category: "Food & Dining", amount: 10000 }));

    const metrics = calculateDebtMetrics(
      useFinanceStore.getState().debts[0],
      useFinanceStore.getState().transactions,
    );
    expect(metrics.amountPaid).toBe(50000);
    expect(metrics.paymentCount).toBe(1);
  });

  it("migrates old debt format to new format", () => {
    const store = useFinanceStore.getState();
    store.addDebt({
      name: "Old Loan",
      lender: "Old Bank",
      originalAmount: 200000,
      interestRate: 5,
      debtType: "Loan",
      repaymentType: "Fixed",
      minimumPayment: 10000,
      dueDate: "2027-01-01",
      startDate: "2026-01-01",
      categories: [],
      accounts: [],
      wallets: [],
      tags: [],
      color: "#ef4444",
      icon: "credit-card",
      notes: "",
      includeTransfers: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const debts = useFinanceStore.getState().debts;
    expect(debts).toHaveLength(1);
    expect(debts[0].name).toBe("Old Loan");
    expect(debts[0].originalAmount).toBe(200000);
  });

  it("deleting a transaction reduces debt amount paid", () => {
    const store = useFinanceStore.getState();
    store.addDebt({ ...baseDebt, id: "d-1", categories: ["Utilities"] });
    store.addTransaction(tx({ id: "tx-1", category: "Utilities", amount: 50000 }));
    store.addTransaction(tx({ id: "tx-2", category: "Utilities", amount: 30000 }));

    let metrics = calculateDebtMetrics(
      useFinanceStore.getState().debts[0],
      useFinanceStore.getState().transactions,
    );
    expect(metrics.amountPaid).toBe(80000);

    store.deleteTransaction("tx-1");
    metrics = calculateDebtMetrics(
      useFinanceStore.getState().debts[0],
      useFinanceStore.getState().transactions,
    );
    expect(metrics.amountPaid).toBe(30000);
  });

  it("handles multiple debts sharing categories", () => {
    const store = useFinanceStore.getState();

    const debtA = { ...baseDebt, id: "d-a", name: "Loan A", categories: ["Utilities"] };
    const debtB = { ...baseDebt, id: "d-b", name: "Loan B", categories: ["Utilities", "Rent"] };
    store.addDebt(debtA);
    store.addDebt(debtB);

    store.addTransaction(tx({ id: "tx-1", category: "Utilities", amount: 50000 }));

    const txs = useFinanceStore.getState().transactions;
    const metricsA = calculateDebtMetrics(debtA, txs);
    const metricsB = calculateDebtMetrics(debtB, txs);

    expect(metricsA.amountPaid).toBe(50000);
    expect(metricsB.amountPaid).toBe(50000);
    expect(metricsA.paymentCount).toBe(1);
    expect(metricsB.paymentCount).toBe(1);
  });

  it("adding a transaction increases debt amount paid", () => {
    const store = useFinanceStore.getState();
    store.addDebt({ ...baseDebt, id: "d-1", categories: ["Utilities"] });

    let metrics = calculateDebtMetrics(
      useFinanceStore.getState().debts[0],
      useFinanceStore.getState().transactions,
    );
    expect(metrics.amountPaid).toBe(0);

    store.addTransaction(tx({ id: "tx-1", category: "Utilities", amount: 25000 }));
    metrics = calculateDebtMetrics(
      useFinanceStore.getState().debts[0],
      useFinanceStore.getState().transactions,
    );
    expect(metrics.amountPaid).toBe(25000);
    expect(metrics.paymentCount).toBe(1);
  });

  it("editing a transaction amount updates debt metrics", () => {
    const store = useFinanceStore.getState();
    store.addDebt({ ...baseDebt, id: "d-1", categories: ["Utilities"] });
    store.addTransaction(tx({ id: "tx-1", category: "Utilities", amount: 25000 }));

    store.updateTransaction("tx-1", { amount: 50000 });

    const metrics = calculateDebtMetrics(
      useFinanceStore.getState().debts[0],
      useFinanceStore.getState().transactions,
    );
    expect(metrics.amountPaid).toBe(50000);
    expect(metrics.remainingBalance).toBe(450000);
  });

  it("editing a transaction category can move it between debts", () => {
    const store = useFinanceStore.getState();
    const debtA = { ...baseDebt, id: "d-a", name: "Loan A", categories: ["Utilities"] };
    const debtB = { ...baseDebt, id: "d-b", name: "Loan B", categories: ["Rent"] };
    store.addDebt(debtA);
    store.addDebt(debtB);
    store.addTransaction(tx({ id: "tx-1", category: "Utilities", amount: 50000 }));

    let metricsA = calculateDebtMetrics(debtA, useFinanceStore.getState().transactions);
    let metricsB = calculateDebtMetrics(debtB, useFinanceStore.getState().transactions);
    expect(metricsA.amountPaid).toBe(50000);
    expect(metricsB.amountPaid).toBe(0);

    store.updateTransaction("tx-1", { category: "Rent" });

    metricsA = calculateDebtMetrics(debtA, useFinanceStore.getState().transactions);
    metricsB = calculateDebtMetrics(debtB, useFinanceStore.getState().transactions);
    expect(metricsA.amountPaid).toBe(0);
    expect(metricsB.amountPaid).toBe(50000);
  });

  it("deleting a repayment transaction reduces debt amount paid", () => {
    const store = useFinanceStore.getState();
    store.addDebt({ ...baseDebt, id: "d-1", categories: ["Utilities"] });
    store.addTransaction(tx({ id: "tx-1", category: "Utilities", amount: 50000 }));
    store.addTransaction(tx({ id: "tx-2", category: "Utilities", amount: 30000 }));

    store.deleteTransaction("tx-1");

    const metrics = calculateDebtMetrics(
      useFinanceStore.getState().debts[0],
      useFinanceStore.getState().transactions,
    );
    expect(metrics.amountPaid).toBe(30000);
    expect(metrics.paymentCount).toBe(1);
  });

  it("deleting a debt does not affect transactions", () => {
    const store = useFinanceStore.getState();
    store.addDebt({ ...baseDebt, id: "d-1", categories: ["Utilities"] });
    store.addTransaction(tx({ id: "tx-1", category: "Utilities", amount: 50000 }));

    expect(useFinanceStore.getState().transactions).toHaveLength(1);
    store.deleteDebt("d-1");
    expect(useFinanceStore.getState().debts).toHaveLength(0);
    expect(useFinanceStore.getState().transactions).toHaveLength(1);
  });

  it("editing a debt's original amount recalculates remaining balance", () => {
    const store = useFinanceStore.getState();
    store.addDebt({ ...baseDebt, id: "d-1", categories: ["Utilities"], originalAmount: 500000 });
    store.addTransaction(tx({ id: "tx-1", category: "Utilities", amount: 100000 }));

    store.updateDebt("d-1", { originalAmount: 300000 });

    const metrics = calculateDebtMetrics(
      useFinanceStore.getState().debts[0],
      useFinanceStore.getState().transactions,
    );
    expect(metrics.remainingBalance).toBe(200000);
    expect(metrics.percentagePaid).toBeCloseTo(33.33, 1);
  });

  it("paying off a debt marks it as paid-off", () => {
    const store = useFinanceStore.getState();
    store.addDebt({ ...baseDebt, id: "d-1", categories: ["Utilities"], originalAmount: 100000 });

    store.addTransaction(tx({ id: "tx-1", category: "Utilities", amount: 50000 }));
    let metrics = calculateDebtMetrics(
      useFinanceStore.getState().debts[0],
      useFinanceStore.getState().transactions,
    );
    expect(metrics.isPaidOff).toBe(false);

    store.addTransaction(tx({ id: "tx-2", category: "Utilities", amount: 50000 }));
    metrics = calculateDebtMetrics(
      useFinanceStore.getState().debts[0],
      useFinanceStore.getState().transactions,
    );
    expect(metrics.isPaidOff).toBe(true);
    expect(metrics.remainingBalance).toBe(0);
  });

  it("multiple debts with shared categories each track their own metrics", () => {
    const store = useFinanceStore.getState();
    const debtA = { ...baseDebt, id: "d-a", name: "Loan A", categories: ["Utilities"], originalAmount: 200000 };
    const debtB = { ...baseDebt, id: "d-b", name: "Loan B", categories: ["Utilities", "Rent"], originalAmount: 300000 };
    store.addDebt(debtA);
    store.addDebt(debtB);

    store.addTransaction(tx({ id: "tx-1", category: "Utilities", amount: 50000 }));
    store.addTransaction(tx({ id: "tx-2", category: "Rent", amount: 25000 }));

    const txs = useFinanceStore.getState().transactions;
    const metricsA = calculateDebtMetrics(debtA, txs);
    const metricsB = calculateDebtMetrics(debtB, txs);

    expect(metricsA.amountPaid).toBe(50000);
    expect(metricsA.paymentCount).toBe(1);
    expect(metricsA.remainingBalance).toBe(150000);

    expect(metricsB.amountPaid).toBe(75000);
    expect(metricsB.paymentCount).toBe(2);
    expect(metricsB.remainingBalance).toBe(225000);
  });

  it("calculateDebtTotals includes updated metrics after transaction edit", () => {
    const store = useFinanceStore.getState();
    const debtA = { ...baseDebt, id: "d-a", originalAmount: 500000, minimumPayment: 25000 };
    store.addDebt(debtA);
    store.addTransaction(tx({ id: "tx-1", amount: 50000 }));

    let totals = calculateDebtTotals(useFinanceStore.getState().debts, useFinanceStore.getState().transactions);
    expect(totals.totalPaid).toBe(50000);
    expect(totals.totalRemaining).toBe(450000);

    store.updateTransaction("tx-1", { amount: 80000 });

    totals = calculateDebtTotals(useFinanceStore.getState().debts, useFinanceStore.getState().transactions);
    expect(totals.totalPaid).toBe(80000);
    expect(totals.totalRemaining).toBe(420000);
  });

  it("getMatchingDebtTransactions respects all debt filters simultaneously", () => {
    const debt = {
      ...baseDebt,
      categories: ["Utilities"],
      accounts: ["Main"],
      wallets: [],
      tags: ["debt-payment"],
    };

    const transactions = [
      tx({ id: "1", category: "Utilities", account: "Main", tags: ["debt-payment"], amount: 10000 }),
      tx({ id: "2", category: "Utilities", account: "Savings", tags: ["debt-payment"], amount: 10000 }),
      tx({ id: "3", category: "Utilities", account: "Main", tags: ["groceries"], amount: 10000 }),
    ];

    const matched = getMatchingDebtTransactions(debt, transactions);
    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe("1");
  });

  it("matches transactions via wallet field when debt has wallets", () => {
    const debt = { ...baseDebt, id: "d-wallet", wallets: ["PayPal", "Mobile Money"] };
    const transactions = [
      tx({ id: "1", account: "PayPal", amount: 15000 }),
      tx({ id: "2", account: "Main Bank", amount: 5000 }),
    ];
    const matched = getMatchingDebtTransactions(debt, transactions);
    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe("1");
  });

  it("matches transactions via merchant description", () => {
    const debt = { ...baseDebt, id: "d-merchant", categories: ["Utilities"] };
    const transactions = [
      tx({ id: "1", category: "Utilities", merchant: "Electric Company", amount: 25000 }),
      tx({ id: "2", category: "Utilities", merchant: "Water Works", amount: 15000 }),
    ];
    const metrics = calculateDebtMetrics(debt, transactions);
    expect(metrics.amountPaid).toBe(40000);
    expect(metrics.paymentCount).toBe(2);
  });

  it("editing a transaction moves it between debts via wallet change", () => {
    const store = useFinanceStore.getState();
    const debtA = { ...baseDebt, id: "d-wa", name: "Wallet Debt A", wallets: ["PayPal"] };
    const debtB = { ...baseDebt, id: "d-wb", name: "Wallet Debt B", wallets: ["Mobile Money"] };
    store.addDebt(debtA);
    store.addDebt(debtB);
    store.addTransaction(tx({ id: "tx-1", account: "PayPal", amount: 30000 }));

    let metricsA = calculateDebtMetrics(debtA, useFinanceStore.getState().transactions);
    let metricsB = calculateDebtMetrics(debtB, useFinanceStore.getState().transactions);
    expect(metricsA.amountPaid).toBe(30000);
    expect(metricsB.amountPaid).toBe(0);

    store.updateTransaction("tx-1", { account: "Mobile Money" });

    metricsA = calculateDebtMetrics(debtA, useFinanceStore.getState().transactions);
    metricsB = calculateDebtMetrics(debtB, useFinanceStore.getState().transactions);
    expect(metricsA.amountPaid).toBe(0);
    expect(metricsB.amountPaid).toBe(30000);
  });

  it("overdue debt with partial payment shows correct remaining", () => {
    const debt = {
      ...baseDebt,
      id: "d-overdue-partial",
      originalAmount: 200000,
      startDate: "2023-01-01T00:00:00.000Z",
      dueDate: "2024-01-01T00:00:00.000Z",
    };
    const transactions = [tx({ id: "1", amount: 50000 })];
    const metrics = calculateDebtMetrics(debt, transactions, new Date("2025-06-01"));
    expect(metrics.isOverdue).toBe(true);
    expect(metrics.remainingBalance).toBe(150000);
    expect(metrics.percentagePaid).toBeCloseTo(25, 1);
  });

  it("handle debt with zero original amount gracefully", () => {
    const debt = { ...baseDebt, id: "d-zero", originalAmount: 0 };
    const metrics = calculateDebtMetrics(debt, []);
    expect(metrics.percentagePaid).toBe(0);
    expect(metrics.remainingBalance).toBe(0);
    expect(metrics.isPaidOff).toBe(true);
  });

  it("calculateDebtTotals excludes paid-off debts from remaining", () => {
    const store = useFinanceStore.getState();
    const debtA = { ...baseDebt, id: "d-a", originalAmount: 100000, minimumPayment: 10000 };
    const debtB = { ...baseDebt, id: "d-b", originalAmount: 200000, minimumPayment: 20000 };
    store.addDebt(debtA);
    store.addDebt(debtB);
    store.addTransaction(tx({ id: "tx-1", amount: 100000 }));

    const totals = calculateDebtTotals(useFinanceStore.getState().debts, useFinanceStore.getState().transactions);
    expect(totals.totalOriginal).toBe(300000);
    expect(totals.totalPaid).toBe(200000);
    expect(totals.totalMin).toBe(30000);
  });

  describe("debtId payment flow", () => {
    it("getMatchingDebtTransactions includes expense with matching debtId", () => {
      const debt = { ...baseDebt, categories: ["Utilities"] };
      const txWithDebtId = tx({ id: "1", category: "NonMatching", amount: 5000 });
      txWithDebtId.debtId = "debt-1";
      const transactions = [txWithDebtId];
      const matched = getMatchingDebtTransactions(debt, transactions);
      expect(matched).toHaveLength(1);
      expect(matched[0].id).toBe("1");
    });

    it("expense payment adds to debt amountPaid", () => {
      const debt = { ...baseDebt, categories: ["Utilities"] };
      const txWithDebtId = tx({ id: "1", category: "NonMatching", amount: 10000 });
      txWithDebtId.debtId = "debt-1";
      const transactions = [txWithDebtId];
      const metrics = calculateDebtMetrics(debt, transactions);
      expect(metrics.amountPaid).toBe(10000);
      expect(metrics.paymentCount).toBe(1);
    });

    it("multiple debtId payments accumulate", () => {
      const debt = { ...baseDebt };
      const t1 = tx({ id: "1", amount: 5000 });
      t1.debtId = "debt-1";
      const t2 = tx({ id: "2", amount: 7000 });
      t2.debtId = "debt-1";
      const transactions = [t1, t2];
      const metrics = calculateDebtMetrics(debt, transactions);
      expect(metrics.amountPaid).toBe(12000);
      expect(metrics.paymentCount).toBe(2);
    });

    it("debtId payments bypass category filter", () => {
      const debt = { ...baseDebt, categories: ["Utilities"] };
      const txWithDebtId = tx({ id: "1", category: "Food", amount: 5000 });
      txWithDebtId.debtId = "debt-1";
      const transactions = [txWithDebtId];
      const matched = getMatchingDebtTransactions(debt, transactions);
      expect(matched).toHaveLength(1);
    });

    it("adding payment transaction via store updates metrics dynamically", () => {
      const store = useFinanceStore.getState();
      store.addDebt({ ...baseDebt, id: "d-1" });

      store.addTransaction({
        date: new Date().toISOString(),
        description: "Payment to Test Loan",
        category: "Debt Payment",
        account: "Main",
        amount: 15000,
        type: "expense",
        notes: "",
        tags: [],
        debtId: "d-1",
      });

      const debt = useFinanceStore.getState().debts[0];
      const metrics = calculateDebtMetrics(debt, useFinanceStore.getState().transactions);
      expect(metrics.amountPaid).toBe(15000);
      expect(metrics.paymentCount).toBe(1);
    });

    it("deleting debtId-linked transaction reduces debt amountPaid", () => {
      const store = useFinanceStore.getState();
      store.addDebt({ ...baseDebt, id: "d-1" });

      const t1 = tx({ id: "tx-1", amount: 10000 });
      t1.debtId = "d-1";
      store.addTransaction(t1);

      const t2 = tx({ id: "tx-2", amount: 5000 });
      t2.debtId = "d-1";
      store.addTransaction(t2);

      let metrics = calculateDebtMetrics({ ...baseDebt, id: "d-1" }, useFinanceStore.getState().transactions);
      expect(metrics.amountPaid).toBe(15000);

      store.deleteTransaction("tx-1");
      metrics = calculateDebtMetrics({ ...baseDebt, id: "d-1" }, useFinanceStore.getState().transactions);
      expect(metrics.amountPaid).toBe(5000);
    });

    it("editing debtId-linked transaction amount updates debt metrics", () => {
      const store = useFinanceStore.getState();
      store.addDebt({ ...baseDebt, id: "d-1" });

      const t1 = tx({ id: "tx-1", amount: 10000 });
      t1.debtId = "d-1";
      store.addTransaction(t1);

      let metrics = calculateDebtMetrics({ ...baseDebt, id: "d-1" }, useFinanceStore.getState().transactions);
      expect(metrics.amountPaid).toBe(10000);

      store.updateTransaction("tx-1", { amount: 25000 });
      metrics = calculateDebtMetrics({ ...baseDebt, id: "d-1" }, useFinanceStore.getState().transactions);
      expect(metrics.amountPaid).toBe(25000);
    });
  });

  it("adding a transaction after debt creation is included in metrics", () => {
    const store = useFinanceStore.getState();
    store.addDebt({ ...baseDebt, id: "d-1", startDate: "2020-01-01", categories: ["Utilities"] });

    store.addTransaction(tx({ id: "old", date: "2021-06-01", category: "Utilities", amount: 25000 }));
    let metrics = calculateDebtMetrics(
      useFinanceStore.getState().debts[0],
      useFinanceStore.getState().transactions,
    );
    expect(metrics.amountPaid).toBe(25000);
    expect(metrics.paymentCount).toBe(1);

    store.addTransaction(tx({ id: "new", date: new Date().toISOString(), category: "Utilities", amount: 15000 }));
    metrics = calculateDebtMetrics(
      useFinanceStore.getState().debts[0],
      useFinanceStore.getState().transactions,
    );
    expect(metrics.amountPaid).toBe(40000);
    expect(metrics.paymentCount).toBe(2);
  });
});
