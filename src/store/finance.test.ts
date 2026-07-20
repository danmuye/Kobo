import { describe, it, expect, beforeEach } from "vitest";
import {
  useFinanceStore,
  getTotalBalance,
  getTotalIncome,
  getTotalExpenses,
  getNetCashFlow,
  getLastTransactionDate,
  getMonthlySummary,
  getMonthlyChart,
  getCategoryBreakdown,
  getCashFlow,
  validateTransfer,
  getTransferHistory,
  getNetTransferBalance,
  getAccountsHealth,
  getMonthlyAccountSummary,
  getMonthlyAccountTrends,
  getAccountActivityTimeline,
  getAccountsByType,
  getGoalDaysRemaining,
} from "./finance";
import {
  buildTransaction,
  buildBudget,
  buildGoal,
  buildDebt,
  buildAccount,
  buildBudgetHistory,
  resetCounter,
} from "@/test/factories";

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
    accounts: [],
  });
});

describe("useFinanceStore", () => {
  describe("addTransaction", () => {
    it("adds a transaction to the beginning", () => {
      useFinanceStore.getState().addTransaction({
        date: "2024-06-15T10:00:00Z",
        description: "Test",
        category: "Food",
        account: "Main",
        amount: 5000,
        type: "expense",
      });
      const txs = useFinanceStore.getState().transactions;
      expect(txs).toHaveLength(1);
      expect(txs[0].description).toBe("Test");
      expect(txs[0].id).toBeDefined();
    });
  });

  describe("updateTransaction", () => {
    it("updates an existing transaction", () => {
      useFinanceStore.getState().addTransaction({
        date: "2024-06-15T10:00:00Z",
        description: "Test",
        category: "Food",
        account: "Main",
        amount: 5000,
        type: "expense",
      });
      const id = useFinanceStore.getState().transactions[0].id;
      useFinanceStore.getState().updateTransaction(id, { amount: 7000 });
      expect(useFinanceStore.getState().transactions[0].amount).toBe(7000);
    });

    it("does nothing for unknown id", () => {
      useFinanceStore.getState().updateTransaction("unknown", { amount: 100 });
      expect(useFinanceStore.getState().transactions).toHaveLength(0);
    });
  });

  describe("deleteTransaction", () => {
    it("removes a transaction by id", () => {
      useFinanceStore.getState().addTransaction({
        date: "2024-06-15T10:00:00Z",
        description: "Test",
        category: "Food",
        account: "Main",
        amount: 5000,
        type: "expense",
      });
      const id = useFinanceStore.getState().transactions[0].id;
      useFinanceStore.getState().deleteTransaction(id);
      expect(useFinanceStore.getState().transactions).toHaveLength(0);
    });
  });

  describe("addBudget / updateBudget / deleteBudget", () => {
    it("adds, updates, and deletes a budget", () => {
      useFinanceStore.getState().addBudget({ name: "Food Budget", category: "Food", icon: "shopping-cart", amount: 50000, period: "Monthly" });
      expect(useFinanceStore.getState().budgets).toHaveLength(1);
      const id = useFinanceStore.getState().budgets[0].id;

      useFinanceStore.getState().updateBudget(id, { amount: 60000 });
      expect(useFinanceStore.getState().budgets[0].amount).toBe(60000);

      useFinanceStore.getState().deleteBudget(id);
      expect(useFinanceStore.getState().budgets).toHaveLength(0);
    });
  });

  describe("budget history", () => {
    it("adds, deletes, and clears budget history", () => {
      useFinanceStore.getState().addBudgetHistory({ budgetId: "b1", budgetName: "Test", period: "Monthly", amount: 50000, spent: 30000, remaining: 20000, percentage: 60, transactionCount: 5, startDate: "2024-06-01", endDate: "2024-06-30", archivedAt: new Date().toISOString() });
      expect(useFinanceStore.getState().budgetHistory).toHaveLength(1);

      const id = useFinanceStore.getState().budgetHistory[0].id;
      useFinanceStore.getState().deleteBudgetHistory(id);
      expect(useFinanceStore.getState().budgetHistory).toHaveLength(0);
    });

    it("clears history by budgetId", () => {
      useFinanceStore.getState().addBudgetHistory({ budgetId: "b1", budgetName: "Test", period: "Monthly", amount: 50000, spent: 30000, remaining: 20000, percentage: 60, transactionCount: 5, startDate: "2024-06-01", endDate: "2024-06-30", archivedAt: new Date().toISOString() });
      useFinanceStore.getState().addBudgetHistory({ budgetId: "b1", budgetName: "Test2", period: "Monthly", amount: 20000, spent: 10000, remaining: 10000, percentage: 50, transactionCount: 3, startDate: "2024-05-01", endDate: "2024-05-31", archivedAt: new Date().toISOString() });
      useFinanceStore.getState().clearBudgetHistory("b1");
      expect(useFinanceStore.getState().budgetHistory).toHaveLength(0);
    });
  });

  describe("addGoal / updateGoal / deleteGoal", () => {
    it("manages goals", () => {
      useFinanceStore.getState().addGoal({ name: "Save for car", targetAmount: 1000000, targetDate: "2025-12-31", startDate: "2024-01-01", fundingType: "Mixed", icon: "car" });
      expect(useFinanceStore.getState().goals).toHaveLength(1);
      const id = useFinanceStore.getState().goals[0].id;

      useFinanceStore.getState().updateGoal(id, { targetAmount: 1200000 });
      expect(useFinanceStore.getState().goals[0].targetAmount).toBe(1200000);

      useFinanceStore.getState().deleteGoal(id);
      expect(useFinanceStore.getState().goals).toHaveLength(0);
    });
  });

  describe("addDebt / updateDebt / deleteDebt", () => {
    it("manages debts", () => {
      useFinanceStore.getState().addDebt({ name: "Car Loan", lender: "Bank", originalAmount: 500000, dueDate: "2025-12-31", startDate: "2024-01-01" });
      expect(useFinanceStore.getState().debts).toHaveLength(1);
      const id = useFinanceStore.getState().debts[0].id;

      useFinanceStore.getState().updateDebt(id, { originalAmount: 400000 });
      expect(useFinanceStore.getState().debts[0].originalAmount).toBe(400000);

      useFinanceStore.getState().deleteDebt(id);
      expect(useFinanceStore.getState().debts).toHaveLength(0);
    });
  });

  describe("addAccount / updateAccount / deleteAccount", () => {
    it("manages accounts", () => {
      useFinanceStore.getState().addAccount({ name: "Main", bank: "GTBank", type: "bank", currency: "NGN", color: "#3b82f6", icon: "wallet", openingBalance: 10000 });
      expect(useFinanceStore.getState().accounts).toHaveLength(1);
      const id = useFinanceStore.getState().accounts[0].id;

      useFinanceStore.getState().updateAccount(id, { openingBalance: 20000 });
      expect(useFinanceStore.getState().accounts[0].openingBalance).toBe(20000);

      useFinanceStore.getState().deleteAccount(id);
      expect(useFinanceStore.getState().accounts).toHaveLength(0);
    });
  });

  describe("clearAllData", () => {
    it("clears all entities", () => {
      useFinanceStore.getState().addTransaction({ date: "2024-06-15", description: "Test", category: "Food", account: "Main", amount: 100, type: "expense" });
      useFinanceStore.getState().addBudget({ name: "Test", category: "Food", icon: "tag", amount: 5000, period: "Monthly" });
      useFinanceStore.getState().clearAllData();
      const state = useFinanceStore.getState();
      expect(state.transactions).toHaveLength(0);
      expect(state.budgets).toHaveLength(0);
      expect(state.goals).toHaveLength(0);
      expect(state.debts).toHaveLength(0);
      expect(state.accounts).toHaveLength(0);
    });
  });

  describe("restoreData", () => {
    it("restores from backup", () => {
      useFinanceStore.getState().restoreData({
        transactions: [buildTransaction({ id: "tx1" })],
        budgets: [buildBudget({ id: "b1" })],
        goals: [buildGoal({ id: "g1" })],
        debts: [buildDebt({ id: "d1" })],
        accounts: [buildAccount({ id: "a1" })],
      });
      expect(useFinanceStore.getState().transactions).toHaveLength(1);
      expect(useFinanceStore.getState().budgets).toHaveLength(1);
      expect(useFinanceStore.getState().goals).toHaveLength(1);
      expect(useFinanceStore.getState().debts).toHaveLength(1);
      expect(useFinanceStore.getState().accounts).toHaveLength(1);
    });
  });
});

describe("selectors", () => {
  describe("getTotalBalance", () => {
    it("returns 0 for empty accounts", () => {
      expect(getTotalBalance([], [])).toBe(0);
    });

    it("computes total across accounts", () => {
      const accounts = [
        buildAccount({ id: "a1", name: "Main", openingBalance: 10000 }),
        buildAccount({ id: "a2", name: "Savings", openingBalance: 50000 }),
      ];
      const txs = [
        buildTransaction({ type: "income", account: "Main", amount: 5000 }),
      ];
      expect(getTotalBalance(accounts, txs)).toBe(65000);
    });
  });

  describe("getTotalIncome", () => {
    it("returns 0 for empty", () => {
      expect(getTotalIncome([])).toBe(0);
    });

    it("sums income transactions", () => {
      const txs = [
        buildTransaction({ type: "income", amount: 10000 }),
        buildTransaction({ type: "income", amount: 20000 }),
        buildTransaction({ type: "expense", amount: 5000 }),
      ];
      expect(getTotalIncome(txs)).toBe(30000);
    });
  });

  describe("getTotalExpenses", () => {
    it("returns 0 for empty", () => {
      expect(getTotalExpenses([])).toBe(0);
    });

    it("sums expense transactions", () => {
      const txs = [
        buildTransaction({ type: "expense", amount: 5000 }),
        buildTransaction({ type: "expense", amount: 3000 }),
        buildTransaction({ type: "income", amount: 10000 }),
      ];
      expect(getTotalExpenses(txs)).toBe(8000);
    });
  });

  describe("getNetCashFlow", () => {
    it("returns income - expenses", () => {
      const txs = [
        buildTransaction({ type: "income", amount: 50000 }),
        buildTransaction({ type: "expense", amount: 30000 }),
      ];
      expect(getNetCashFlow(txs)).toBe(20000);
    });
  });

  describe("getLastTransactionDate", () => {
    it("returns null when no transactions", () => {
      expect(getLastTransactionDate([])).toBeNull();
    });

    it("returns latest date", () => {
      const txs = [
        buildTransaction({ date: "2024-01-01T10:00:00Z" }),
        buildTransaction({ date: "2024-06-15T10:00:00Z" }),
        buildTransaction({ date: "2024-03-01T10:00:00Z" }),
      ];
      const date = getLastTransactionDate(txs);
      expect(date).toContain("2024-06-15");
    });
  });

  describe("getMonthlySummary", () => {
    it("returns zeros when no transactions", () => {
      const result = getMonthlySummary([]);
      expect(result.income).toBe(0);
      expect(result.expenses).toBe(0);
      expect(result.savings).toBe(0);
    });
  });

  describe("getMonthlyChart", () => {
    it("returns entries for N months", () => {
      const result = getMonthlyChart([], 3);
      expect(result).toHaveLength(3);
    });
  });

  describe("getCategoryBreakdown", () => {
    it("returns empty for no expenses", () => {
      expect(getCategoryBreakdown([])).toEqual([]);
    });

    it("aggregates expenses by category", () => {
      const txs = [
        buildTransaction({ type: "expense", category: "Food", amount: 5000 }),
        buildTransaction({ type: "expense", category: "Transport", amount: 3000 }),
        buildTransaction({ type: "expense", category: "Food", amount: 2000 }),
      ];
      const result = getCategoryBreakdown(txs);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Food");
      expect(result[0].value).toBe(7000);
    });
  });

  describe("getCashFlow", () => {
    it("derives cash flow from chart entries", () => {
      const chart = [{ month: "Jun 24", income: 10000, expenses: 6000, net: 4000 }];
      const result = getCashFlow(chart);
      expect(result[0].cashFlow).toBe(4000);
    });
  });

  describe("validateTransfer", () => {
    it("returns errors for missing accounts", () => {
      const result = validateTransfer({}, [buildAccount({ name: "Main" })]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Source account is required");
      expect(result.errors).toContain("Destination account is required");
    });

    it("errors when same account", () => {
      const result = validateTransfer({ fromAccount: "Main", toAccount: "Main", amount: 1000 }, [buildAccount({ name: "Main" })]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Cannot transfer to the same account");
    });

    it("errors for unknown accounts", () => {
      const result = validateTransfer({ fromAccount: "Unknown", toAccount: "Main", amount: 1000 }, [buildAccount({ name: "Main" })]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Source account "Unknown" not found');
    });

    it("passes valid transfer", () => {
      const result = validateTransfer(
        { fromAccount: "Checking", toAccount: "Savings", amount: 5000 },
        [buildAccount({ name: "Checking" }), buildAccount({ name: "Savings" })],
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("getTransferHistory", () => {
    it("returns sorted transfer transactions", () => {
      const txs = [
        buildTransaction({ type: "transfer", date: "2024-01-01T10:00:00Z" }),
        buildTransaction({ type: "expense", date: "2024-06-15T10:00:00Z" }),
        buildTransaction({ type: "transfer", date: "2024-03-01T10:00:00Z" }),
      ];
      const result = getTransferHistory(txs);
      expect(result).toHaveLength(2);
      expect(result[0].date).toContain("2024-03-01");
      expect(result[1].date).toContain("2024-01-01");
    });
  });

  describe("getNetTransferBalance", () => {
    it("returns net transfers for account", () => {
      const txs = [
        buildTransaction({ type: "transfer", fromAccount: "Main", toAccount: "Savings", amount: 5000 }),
        buildTransaction({ type: "transfer", fromAccount: "Other", toAccount: "Main", amount: 3000 }),
      ];
      expect(getNetTransferBalance("Main", txs)).toBe(-2000);
    });
  });

  describe("getAccountsByType", () => {
    it("filters accounts by type", () => {
      const accounts = [
        buildAccount({ id: "a1", type: "bank" }),
        buildAccount({ id: "a2", type: "credit_card" }),
        buildAccount({ id: "a3", type: "cash" }),
      ];
      const result = getAccountsByType(accounts, ["bank", "cash"]);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("a1");
    });
  });

  describe("getGoalDaysRemaining", () => {
    it("returns 0 for past dates", () => {
      const goal = buildGoal({ targetDate: "2020-01-01" });
      expect(getGoalDaysRemaining(goal)).toBe(0);
    });
  });

  describe("getMonthlyAccountSummary", () => {
    it("returns summary for each account", () => {
      const accounts = [buildAccount({ id: "a1", name: "Main" })];
      const result = getMonthlyAccountSummary(accounts, []);
      expect(result).toHaveLength(1);
      expect(result[0].accountName).toBe("Main");
    });
  });

  describe("getAccountActivityTimeline", () => {
    it("returns recent transactions for account", () => {
      const txs = [buildTransaction({ account: "Main", type: "expense", date: "2024-06-15T10:00:00Z" })];
      const result = getAccountActivityTimeline("Main", txs, 10);
      expect(result).toHaveLength(1);
    });
  });

  describe("getMonthlyAccountTrends", () => {
    it("returns trend entries for accounts", () => {
      const accounts = [buildAccount({ id: "a1", name: "Main", openingBalance: 0 })];
      const txs = [buildTransaction({ account: "Main", type: "income", amount: 5000, date: "2024-06-15T10:00:00Z" })];
      const result = getMonthlyAccountTrends(accounts, txs, 3);
      expect(result).toHaveLength(1);
      expect(result[0].data).toHaveLength(3);
    });
  });

  describe("getAccountsHealth", () => {
    it("returns health indicators", () => {
      const accounts = [buildAccount({ id: "a1", name: "Main", openingBalance: 10000 })];
      const txs = [buildTransaction({ account: "Main", type: "income", amount: 5000, date: new Date().toISOString() })];
      const result = getAccountsHealth(accounts, txs);
      expect(result).toHaveLength(1);
      expect(result[0].accountName).toBe("Main");
    });
  });
});
