import { describe, expect, it, beforeEach } from "vitest";
import { calculateGoalMetrics, getMatchingGoalTransactions } from "@/services/goal-matching";
import { useFinanceStore } from "@/store/finance";
import type { Goal, Transaction } from "@/types";

const baseGoal: Goal = {
  id: "goal-1",
  name: "Test Goal",
  targetAmount: 100000,
  targetDate: new Date(new Date().getFullYear() + 1, 0, 1).toISOString(),
  startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString(),
  fundingType: "Mixed",
  categories: [],
  accounts: [],
  wallets: [],
  tags: [],
  color: "#8b5cf6",
  icon: "target",
  priority: "medium",
  notes: "",
  autoTrack: true,
  includeTransfers: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function tx(overrides: Partial<Transaction> & { id: string }): Transaction {
  return {
    date: new Date().toISOString(),
    description: "Test transaction",
    category: "Salary",
    account: "Main",
    amount: 10000,
    type: "income",
    tags: [],
    ...overrides,
  };
}

describe("goal-matching service", () => {
  describe("getMatchingGoalTransactions", () => {
    it("returns transactions with matching goalId", () => {
      const goal = { ...baseGoal };
      const transactions = [
        tx({ id: "1", goalId: "goal-1" }),
        tx({ id: "2" }),
        tx({ id: "3", goalId: "other" }),
      ];
      const matched = getMatchingGoalTransactions(goal, transactions);
      expect(matched).toHaveLength(1);
      expect(matched[0].id).toBe("1");
    });

    it("returns multiple transactions with matching goalId", () => {
      const goal = { ...baseGoal };
      const transactions = [
        tx({ id: "1", goalId: "goal-1" }),
        tx({ id: "2", goalId: "goal-1" }),
      ];
      const matched = getMatchingGoalTransactions(goal, transactions);
      expect(matched).toHaveLength(2);
    });

    it("returns empty when no transactions have matching goalId", () => {
      const goal = { ...baseGoal };
      const transactions = [
        tx({ id: "1", goalId: "other" }),
        tx({ id: "2" }),
      ];
      const matched = getMatchingGoalTransactions(goal, transactions);
      expect(matched).toHaveLength(0);
    });

    it("returns empty when transactions list is empty", () => {
      const matched = getMatchingGoalTransactions(baseGoal, []);
      expect(matched).toHaveLength(0);
    });

    it("goalId matching is independent of transaction type", () => {
      const goal = { ...baseGoal };
      const transactions = [
        tx({ id: "1", type: "expense", goalId: "goal-1" }),
        tx({ id: "2", type: "income", goalId: "goal-1" }),
        tx({ id: "3", type: "transfer", goalId: "goal-1" }),
      ];
      const matched = getMatchingGoalTransactions(goal, transactions);
      expect(matched).toHaveLength(3);
    });

    it("different goals only match their own goalId", () => {
      const goalA = { ...baseGoal, id: "a" };
      const goalB = { ...baseGoal, id: "b" };
      const transactions = [
        tx({ id: "1", goalId: "a" }),
        tx({ id: "2", goalId: "b" }),
        tx({ id: "3", goalId: "a" }),
      ];
      const matchedA = getMatchingGoalTransactions(goalA, transactions);
      const matchedB = getMatchingGoalTransactions(goalB, transactions);
      expect(matchedA).toHaveLength(2);
      expect(matchedB).toHaveLength(1);
      expect(matchedA.map((t) => t.id)).toEqual(["1", "3"]);
      expect(matchedB.map((t) => t.id)).toEqual(["2"]);
    });
  });

  describe("calculateGoalMetrics", () => {
    it("calculates saved amount correctly", () => {
      const transactions = [
        tx({ id: "1", amount: 25000, goalId: "goal-1" }),
        tx({ id: "2", amount: 15000, goalId: "goal-1" }),
      ];
      const metrics = calculateGoalMetrics(baseGoal, transactions);
      expect(metrics.saved).toBe(40000);
      expect(metrics.remaining).toBe(60000);
    });

    it("returns zero saved when no transactions match", () => {
      const metrics = calculateGoalMetrics({ ...baseGoal, id: "nonexistent" }, []);
      expect(metrics.saved).toBe(0);
      expect(metrics.remaining).toBe(100000);
      expect(metrics.percentage).toBe(0);
      expect(metrics.transactionCount).toBe(0);
    });

    it("marks goal as completed when saved meets or exceeds target", () => {
      const transactions = [tx({ id: "1", amount: 100000, goalId: "goal-1" })];
      const metrics = calculateGoalMetrics(baseGoal, transactions);
      expect(metrics.isCompleted).toBe(true);
      expect(metrics.isOverTarget).toBe(false);
      expect(metrics.percentage).toBe(100);
    });

    it("marks goal as over target when saved exceeds target", () => {
      const transactions = [tx({ id: "1", amount: 150000, goalId: "goal-1" })];
      const metrics = calculateGoalMetrics(baseGoal, transactions);
      expect(metrics.isCompleted).toBe(true);
      expect(metrics.isOverTarget).toBe(true);
      expect(metrics.percentage).toBe(150);
    });

    it("detects expired goals", () => {
      const goal = {
        ...baseGoal,
        startDate: "2020-01-01T00:00:00.000Z",
        targetDate: "2020-06-01T00:00:00.000Z",
      };
      const transactions: Transaction[] = [];
      const metrics = calculateGoalMetrics(goal, transactions, new Date("2025-01-01"));
      expect(metrics.isExpired).toBe(true);
      expect(metrics.isCompleted).toBe(false);
    });

    it("calculates completion date for completed goals", () => {
      const transactions = [
        tx({ id: "1", date: "2025-01-01T00:00:00.000Z", amount: 60000, goalId: "goal-1" }),
        tx({ id: "2", date: "2025-06-01T00:00:00.000Z", amount: 50000, goalId: "goal-1" }),
      ];
      const goal = {
        ...baseGoal,
        targetAmount: 100000,
        startDate: "2024-01-01T00:00:00.000Z",
        targetDate: "2025-12-31T00:00:00.000Z",
      };
      const metrics = calculateGoalMetrics(goal, transactions, new Date("2025-07-01"));
      expect(metrics.isCompleted).toBe(true);
      expect(metrics.completionDate).toBe("2025-06-01T00:00:00.000Z");
    });

    it("returns correct transaction count", () => {
      const transactions = [
        tx({ id: "1", amount: 10000, goalId: "goal-1" }),
        tx({ id: "2", amount: 20000, goalId: "goal-1" }),
        tx({ id: "3", amount: 30000, goalId: "goal-1" }),
      ];
      const metrics = calculateGoalMetrics(baseGoal, transactions);
      expect(metrics.transactionCount).toBe(3);
    });
  });
});

describe("goal store integration", () => {
  beforeEach(() => {
    useFinanceStore.setState({
      transactions: [],
      budgets: [],
      budgetHistory: [],
      goals: [],
      debts: [],
      accounts: [],
    });
  });

  it("adds a goal and returns it in state", () => {
    const store = useFinanceStore.getState();
    store.addGoal({ ...baseGoal, id: undefined });
    const goals = useFinanceStore.getState().goals;
    expect(goals).toHaveLength(1);
    expect(goals[0].name).toBe("Test Goal");
    expect(goals[0].id).toBeTruthy();
  });

  it("deletes a goal without affecting transactions", () => {
    const store = useFinanceStore.getState();
    store.addTransaction(tx({ id: "tx-1" }));
    store.addGoal({ ...baseGoal, id: "g-1" });
    expect(useFinanceStore.getState().goals).toHaveLength(1);
    expect(useFinanceStore.getState().transactions).toHaveLength(1);

    useFinanceStore.getState().deleteGoal("g-1");
    expect(useFinanceStore.getState().goals).toHaveLength(0);
    expect(useFinanceStore.getState().transactions).toHaveLength(1);
  });

  it("updates a goal and recalculates metrics", () => {
    const store = useFinanceStore.getState();
    store.addGoal({ ...baseGoal, id: "g-1" });
    store.updateGoal("g-1", { targetAmount: 500000 });

    const goal = useFinanceStore.getState().goals[0];
    expect(goal.targetAmount).toBe(500000);

    const metrics = calculateGoalMetrics(goal, []);
    expect(metrics.saved).toBe(0);
    expect(metrics.remaining).toBe(500000);
  });

  it("adding a transaction updates goal metrics when it has matching goalId", () => {
    const store = useFinanceStore.getState();
    const goal: Goal = { ...baseGoal, id: "g-1", targetAmount: 100000 };
    store.addGoal(goal);

    store.addTransaction(tx({ id: "tx-1", goalId: "g-1", amount: 50000 }));
    store.addTransaction(tx({ id: "tx-2", amount: 10000 }));

    const updatedGoal = useFinanceStore.getState().goals[0];
    const metrics = calculateGoalMetrics(updatedGoal, useFinanceStore.getState().transactions);

    expect(metrics.saved).toBe(50000);
    expect(metrics.transactionCount).toBe(1);
  });

  it("updating goalId on a transaction moves it between goals", () => {
    const store = useFinanceStore.getState();
    const goalA: Goal = { ...baseGoal, id: "g-1", targetAmount: 100000 };
    const goalB: Goal = { ...baseGoal, id: "g-2", targetAmount: 50000 };
    store.addGoal(goalA);
    store.addGoal(goalB);

    store.addTransaction(tx({ id: "tx-1", goalId: "g-1", amount: 30000 }));

    let txs = useFinanceStore.getState().transactions;
    let metricsA = calculateGoalMetrics(goalA, txs);
    let metricsB = calculateGoalMetrics(goalB, txs);
    expect(metricsA.saved).toBe(30000);
    expect(metricsB.saved).toBe(0);

    store.updateTransaction("tx-1", { goalId: "g-2" });

    txs = useFinanceStore.getState().transactions;
    metricsA = calculateGoalMetrics(goalA, txs);
    metricsB = calculateGoalMetrics(goalB, txs);
    expect(metricsA.saved).toBe(0);
    expect(metricsB.saved).toBe(30000);
  });

  it("deleting a transaction reduces goal saved amount", () => {
    const store = useFinanceStore.getState();
    const goal: Goal = { ...baseGoal, id: "g-1", targetAmount: 100000 };
    store.addGoal(goal);
    store.addTransaction(tx({ id: "tx-1", goalId: "g-1", amount: 50000 }));
    store.addTransaction(tx({ id: "tx-2", goalId: "g-1", amount: 30000 }));

    let metrics = calculateGoalMetrics(goal, useFinanceStore.getState().transactions);
    expect(metrics.saved).toBe(80000);

    store.deleteTransaction("tx-1");

    metrics = calculateGoalMetrics(goal, useFinanceStore.getState().transactions);
    expect(metrics.saved).toBe(30000);
  });

  it("each goal only counts transactions with its own goalId", () => {
    const store = useFinanceStore.getState();

    const vacationGoal: Goal = {
      ...baseGoal, id: "g-1", name: "Vacation",
      targetAmount: 200000,
    };
    const emergencyGoal: Goal = {
      ...baseGoal, id: "g-2", name: "Emergency Fund",
      targetAmount: 300000,
    };
    store.addGoal(vacationGoal);
    store.addGoal(emergencyGoal);

    store.addTransaction(tx({ id: "tx-1", goalId: "g-1", amount: 100000 }));

    const txs = useFinanceStore.getState().transactions;
    const vacationMetrics = calculateGoalMetrics(vacationGoal, txs);
    const emergencyMetrics = calculateGoalMetrics(emergencyGoal, txs);

    expect(vacationMetrics.saved).toBe(100000);
    expect(emergencyMetrics.saved).toBe(0);
    expect(vacationMetrics.transactionCount).toBe(1);
    expect(emergencyMetrics.transactionCount).toBe(0);
  });

  it("goal completion triggers when saved reaches target", () => {
    const store = useFinanceStore.getState();
    const goal: Goal = { ...baseGoal, id: "g-1", targetAmount: 50000 };
    store.addGoal(goal);

    store.addTransaction(tx({ id: "tx-1", goalId: "g-1", amount: 30000 }));
    let metrics = calculateGoalMetrics(goal, useFinanceStore.getState().transactions);
    expect(metrics.isCompleted).toBe(false);

    store.addTransaction(tx({ id: "tx-2", goalId: "g-1", amount: 20000 }));
    metrics = calculateGoalMetrics(goal, useFinanceStore.getState().transactions);
    expect(metrics.isCompleted).toBe(true);
    expect(metrics.saved).toBe(50000);
  });

  it("goal with zero target amount is immediately completed", () => {
    const goal = { ...baseGoal, targetAmount: 0 };
    const metrics = calculateGoalMetrics(goal, []);
    expect(metrics.percentage).toBe(0);
    expect(metrics.isCompleted).toBe(true);
  });

  it("progress bar test — handle large percentage gracefully", () => {
    const goal = { ...baseGoal, targetAmount: 1000 };
    const transactions = [tx({ id: "1", amount: 5000, goalId: "goal-1" })];
    const metrics = calculateGoalMetrics(goal, transactions);
    expect(metrics.percentage).toBe(500);
    expect(metrics.isCompleted).toBe(true);
    expect(metrics.isOverTarget).toBe(true);
  });

  describe("goalId contribution flow", () => {
    it("getMatchingGoalTransactions includes expense with matching goalId", () => {
      const goal = { ...baseGoal, fundingType: "Income" };
      const txWithGoalId = tx({ id: "1", type: "expense", amount: 5000 });
      txWithGoalId.goalId = "goal-1";
      const transactions = [txWithGoalId];
      const matched = getMatchingGoalTransactions(goal, transactions);
      expect(matched).toHaveLength(1);
      expect(matched[0].id).toBe("1");
    });

    it("expense contribution adds to goal saved amount", () => {
      const goal = { ...baseGoal, fundingType: "Income" };
      const txWithGoalId = tx({ id: "1", type: "expense", amount: 10000 });
      txWithGoalId.goalId = "goal-1";
      const transactions = [txWithGoalId];
      const metrics = calculateGoalMetrics(goal, transactions);
      expect(metrics.saved).toBe(10000);
      expect(metrics.transactionCount).toBe(1);
    });

    it("multiple goalId contributions accumulate", () => {
      const goal = { ...baseGoal, fundingType: "Income" };
      const t1 = tx({ id: "1", type: "expense", amount: 5000 });
      t1.goalId = "goal-1";
      const t2 = tx({ id: "2", type: "expense", amount: 7000 });
      t2.goalId = "goal-1";
      const transactions = [t1, t2];
      const metrics = calculateGoalMetrics(goal, transactions);
      expect(metrics.saved).toBe(12000);
      expect(metrics.transactionCount).toBe(2);
    });

    it("goalId-only matching: income without goalId is not matched", () => {
      const goal = { ...baseGoal, fundingType: "Income" };
      const txWithGoalId = tx({ id: "1", type: "expense", amount: 5000 });
      txWithGoalId.goalId = "goal-1";
      const incomeTx = tx({ id: "2", type: "income", amount: 3000 });
      const transactions = [txWithGoalId, incomeTx];
      const matched = getMatchingGoalTransactions(goal, transactions);
      expect(matched).toHaveLength(1);
      expect(matched[0].id).toBe("1");
    });

    it("goalId contributions bypass category filter", () => {
      const goal = { ...baseGoal, categories: ["Salary"] };
      const txWithGoalId = tx({ id: "1", category: "Food", amount: 5000 });
      txWithGoalId.goalId = "goal-1";
      const transactions = [txWithGoalId];
      const matched = getMatchingGoalTransactions(goal, transactions);
      expect(matched).toHaveLength(1);
    });

    it("adding contribution transaction via store updates metrics dynamically", () => {
      const store = useFinanceStore.getState();
      store.addGoal({ ...baseGoal, id: "g-1", fundingType: "Income" });

      const txPayload: Omit<Transaction, "id"> = {
        date: new Date().toISOString(),
        description: "Contribution to Test Goal",
        category: "Savings Contribution",
        account: "Main",
        amount: 15000,
        type: "expense",
        notes: "",
        tags: [],
        goalId: "g-1",
      };
      store.addTransaction(txPayload);

      const goal = useFinanceStore.getState().goals[0];
      const metrics = calculateGoalMetrics(goal, useFinanceStore.getState().transactions);
      expect(metrics.saved).toBe(15000);
      expect(metrics.transactionCount).toBe(1);
    });

    it("editing contribution transaction category does not unlink from goal", () => {
      const store = useFinanceStore.getState();
      store.addGoal({ ...baseGoal, id: "g-1" });

      const t1 = tx({ id: "tx-1", goalId: "g-1", amount: 10000 });
      store.addTransaction(t1);

      let metrics = calculateGoalMetrics({ ...baseGoal, id: "g-1" }, useFinanceStore.getState().transactions);
      expect(metrics.transactionCount).toBe(1);
      expect(metrics.saved).toBe(10000);

      store.updateTransaction("tx-1", { category: "Gifts" });

      metrics = calculateGoalMetrics({ ...baseGoal, id: "g-1" }, useFinanceStore.getState().transactions);
      expect(metrics.transactionCount).toBe(1);
      expect(metrics.saved).toBe(10000);
    });

    it("deleting goalId-linked transaction reduces goal saved amount", () => {
      const store = useFinanceStore.getState();
      store.addGoal({ ...baseGoal, id: "g-1", fundingType: "Mixed" });

      const t1 = tx({ id: "tx-1", amount: 10000 });
      t1.goalId = "g-1";
      store.addTransaction(t1);

      const t2 = tx({ id: "tx-2", amount: 5000 });
      t2.goalId = "g-1";
      store.addTransaction(t2);

      let metrics = calculateGoalMetrics({ ...baseGoal, id: "g-1" }, useFinanceStore.getState().transactions);
      expect(metrics.saved).toBe(15000);

      store.deleteTransaction("tx-1");
      metrics = calculateGoalMetrics({ ...baseGoal, id: "g-1" }, useFinanceStore.getState().transactions);
      expect(metrics.saved).toBe(5000);
    });
  });

  it("editing a goal triggers recalculation", () => {
    const store = useFinanceStore.getState();
    const goal: Goal = { ...baseGoal, id: "g-1", targetAmount: 100000 };
    store.addGoal(goal);
    store.addTransaction(tx({ id: "tx-1", goalId: "g-1", amount: 50000 }));

    let metrics = calculateGoalMetrics(goal, useFinanceStore.getState().transactions);
    expect(metrics.percentage).toBe(50);

    store.updateGoal("g-1", { targetAmount: 25000 });
    const updatedGoal = useFinanceStore.getState().goals[0];
    metrics = calculateGoalMetrics(updatedGoal, useFinanceStore.getState().transactions);
    expect(metrics.percentage).toBe(200);
    expect(metrics.isCompleted).toBe(true);
    expect(metrics.isOverTarget).toBe(true);
  });
});
