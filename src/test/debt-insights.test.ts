import { describe, expect, it } from "vitest";
import {
  calculateDebtInsights,
  getPaymentTrend,
  getOutstandingTrend,
  getDebtDistribution,
  getPayoffForecast,
  getDebtUtilization,
  getPaymentCalendar,
  getDebtAnalytics,
} from "@/services/debt-insights";
import {
  archiveDebtMetrics,
  getDebtPaymentMilestones,
  getDebtMonthlySummary,
} from "@/services/debt-history";
import { calculateDebtMetrics } from "@/services/debt-matching";
import { useFinanceStore } from "@/store/finance";
import type { Debt, Transaction } from "@/types";

const baseDebt: Debt = {
  id: "debt-ins-1",
  name: "Insight Loan",
  lender: "Test Bank",
  originalAmount: 600000,
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

describe("calculateDebtInsights", () => {
  it("calculates average monthly repayment", () => {
    const debt = {
      ...baseDebt,
      startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const transactions = [tx({ id: "1", amount: 30000 })];
    const insights = calculateDebtInsights(debt, transactions);
    expect(insights.averageMonthlyRepayment).toBeGreaterThan(0);
    expect(insights.paymentCount).toBeUndefined();
  });

  it("detects largest and smallest payments", () => {
    const transactions = [
      tx({ id: "1", amount: 10000 }),
      tx({ id: "2", amount: 50000 }),
      tx({ id: "3", amount: 25000 }),
    ];
    const insights = calculateDebtInsights(baseDebt, transactions);
    expect(insights.largestPayment).toBe(50000);
    expect(insights.smallestPayment).toBe(10000);
  });

  it("estimates payoff date when making payments", () => {
    const transactions = [tx({ id: "1", amount: 50000 })];
    const insights = calculateDebtInsights(baseDebt, transactions);
    expect(insights.estimatedPayoffDate).not.toBeNull();
    expect(insights.debtFreeForecast).toBeGreaterThan(0);
  });

  it("returns zero interest estimate for zero-rate debts", () => {
    const debt = { ...baseDebt, interestRate: 0 };
    const insights = calculateDebtInsights(debt, []);
    expect(insights.totalInterestEstimate).toBe(0);
  });

  it("health score is between 0 and 100", () => {
    const transactions = [
      tx({ id: "1", amount: 50000 }),
      tx({ id: "2", amount: 30000 }),
    ];
    const insights = calculateDebtInsights(baseDebt, transactions);
    expect(insights.debtHealthScore).toBeGreaterThanOrEqual(0);
    expect(insights.debtHealthScore).toBeLessThanOrEqual(100);
  });

  it("calculates payment frequency", () => {
    const transactions = [
      tx({ id: "1", amount: 10000 }),
      tx({ id: "2", amount: 20000 }),
    ];
    const insights = calculateDebtInsights(baseDebt, transactions);
    expect(insights.paymentFrequency).toBeGreaterThan(0);
  });

  it("handles no transactions gracefully", () => {
    const insights = calculateDebtInsights(baseDebt, []);
    expect(insights.averagePaymentSize).toBe(0);
    expect(insights.largestPayment).toBe(0);
    expect(insights.smallestPayment).toBe(0);
    expect(insights.paymentFrequency).toBe(0);
  });
});

describe("getPaymentTrend", () => {
  it("returns monthly payment data for 12 months", () => {
    const trend = getPaymentTrend(baseDebt, []);
    expect(trend.length).toBe(12);
    expect(trend[0]).toHaveProperty("month");
    expect(trend[0]).toHaveProperty("paid");
    expect(trend[0]).toHaveProperty("runningTotal");
  });

  it("includes payments in correct month", () => {
    const transactions = [tx({ id: "1", amount: 25000 })];
    const trend = getPaymentTrend(baseDebt, transactions);
    const currentMonth = new Date().toLocaleString("en-US", { month: "short", year: "2-digit" });
    const current = trend.find((t) => t.month === currentMonth);
    expect(current?.paid).toBe(25000);
  });
});

describe("getOutstandingTrend", () => {
  it("returns outstanding balance per month", () => {
    const transactions = [tx({ id: "1", amount: 100000 })];
    const trend = getOutstandingTrend(baseDebt, transactions);
    expect(trend.length).toBe(12);
    expect(trend[0].outstanding).toBeLessThanOrEqual(baseDebt.originalAmount);
  });
});

describe("getDebtDistribution", () => {
  it("calculates distribution across debts", () => {
    const debtA = { ...baseDebt, id: "a", originalAmount: 500000 };
    const debtB = { ...baseDebt, id: "b", originalAmount: 300000 };
    const txs = [tx({ id: "1", amount: 50000 })];
    const dist = getDebtDistribution([debtA, debtB], txs);
    expect(dist).toHaveLength(2);
    expect(dist[0].originalAmount).toBe(500000);
    expect(dist[1].originalAmount).toBe(300000);
  });
});

describe("getPayoffForecast", () => {
  it("estimates months to payoff", () => {
    const forecast = getPayoffForecast([baseDebt], []);
    expect(forecast.monthsRemaining).toBeGreaterThan(0);
    expect(forecast.estimatedPayoffDate).not.toBeNull();
  });

  it("shows onTrack when minimum payment exists", () => {
    const forecast = getPayoffForecast([baseDebt], []);
    expect(forecast.onTrack).toBe(true);
  });
});

describe("getDebtUtilization", () => {
  it("calculates utilization rate", () => {
    const util = getDebtUtilization([baseDebt], []);
    expect(util.totalOriginal).toBe(600000);
    expect(util.totalRemaining).toBe(600000);
    expect(util.utilizationRate).toBe(100);
    expect(util.payoffProgress).toBe(0);
  });

  it("shows progress after payments", () => {
    const txs = [tx({ id: "1", amount: 200000 })];
    const util = getDebtUtilization([baseDebt], txs);
    expect(util.totalPaid).toBeGreaterThan(0);
    expect(util.payoffProgress).toBeGreaterThan(0);
  });
});

describe("getPaymentCalendar", () => {
  it("returns sorted payment entries", () => {
    const now = new Date();
    const transactions = [
      tx({ id: "1", amount: 30000, date: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString() }),
      tx({ id: "2", amount: 20000, date: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString() }),
    ];
    const calendar = getPaymentCalendar(baseDebt, transactions);
    expect(calendar).toHaveLength(2);
    expect(new Date(calendar[0].date).getTime()).toBeLessThan(new Date(calendar[1].date).getTime());
  });
});

describe("getDebtAnalytics", () => {
  it("returns null for empty debts", () => {
    const analytics = getDebtAnalytics([], []);
    expect(analytics).toBeNull();
  });

  it("computes aggregate analytics", () => {
    const analytics = getDebtAnalytics([baseDebt], []);
    expect(analytics).not.toBeNull();
    expect(analytics!.insights.debtHealthScore).toBeGreaterThanOrEqual(0);
    expect(analytics!.utilization.totalOriginal).toBe(600000);
  });
});

describe("archiveDebtMetrics", () => {
  it("creates a history entry for paid debt", () => {
    const debt = { ...baseDebt, id: "arch-1", originalAmount: 100000 };
    const transactions = [tx({ id: "1", amount: 100000 })];
    const entry = archiveDebtMetrics(debt, transactions);
    expect(entry.debtId).toBe("arch-1");
    expect(entry.amountPaid).toBe(100000);
    expect(entry.percentagePaid).toBe(100);
    expect(entry.payoffDate).toBeTruthy();
  });

  it("captures debt metadata in history entry", () => {
    const entry = archiveDebtMetrics(baseDebt, []);
    expect(entry.debtName).toBe("Insight Loan");
    expect(entry.lender).toBe("Test Bank");
    expect(entry.debtType).toBe("Loan");
    expect(entry.repaymentType).toBe("Fixed");
  });
});

describe("getDebtPaymentMilestones", () => {
  it("returns 5 milestones", () => {
    const milestones = getDebtPaymentMilestones(baseDebt, []);
    expect(milestones).toHaveLength(5);
    expect(milestones[0].pct).toBe(25);
    expect(milestones[4].pct).toBe(100);
  });

  it("marks milestones as achieved based on payments", () => {
    const debt = { ...baseDebt, originalAmount: 100000 };
    const transactions = [tx({ id: "1", amount: 30000 })];
    const milestones = getDebtPaymentMilestones(debt, transactions);
    expect(milestones[0].achieved).toBe(true);
    expect(milestones[1].achieved).toBe(false);
  });
});

describe("getDebtMonthlySummary", () => {
  it("returns monthly breakdown", () => {
    const summary = getDebtMonthlySummary(baseDebt, []);
    expect(summary.length).toBe(12);
    expect(summary[0]).toHaveProperty("year");
    expect(summary[0]).toHaveProperty("month");
    expect(summary[0]).toHaveProperty("amountPaid");
    expect(summary[0]).toHaveProperty("paymentCount");
  });
});

describe("store integration — debt history", () => {
  beforeEach(() => {
    useFinanceStore.setState({
      transactions: [],
      budgets: [],
      budgetHistory: [],
      goals: [],
      goalHistory: [],
      debts: [],
      debtHistory: [],
      accounts: [],
    });
  });

  it("adds debt history entry to store", () => {
    useFinanceStore.setState({
      transactions: [],
      budgets: [],
      budgetHistory: [],
      goals: [],
      goalHistory: [],
      debts: [],
      debtHistory: [],
      accounts: [],
    });

    const store = useFinanceStore.getState();
    const debt = { ...baseDebt, id: "store-hist-1", originalAmount: 100000 };
    const transactions = [tx({ id: "hist-tx-1", amount: 100000 })];
    const entry = archiveDebtMetrics(debt, transactions);
    store.addDebtHistory(entry);

    const history = useFinanceStore.getState().debtHistory;
    expect(history).toHaveLength(1);
    expect(history[0].debtId).toBe("store-hist-1");
  });

  it("clears debt history by debt id", () => {
    const store = useFinanceStore.getState();
    const entry = archiveDebtMetrics(baseDebt, []);
    store.addDebtHistory(entry);
    expect(useFinanceStore.getState().debtHistory).toHaveLength(1);

    store.clearDebtHistory(baseDebt.id);
    expect(useFinanceStore.getState().debtHistory).toHaveLength(0);
  });
});
