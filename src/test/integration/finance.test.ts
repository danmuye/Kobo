import { describe, it, expect, beforeEach } from "vitest";
import { useFinanceStore, getTotalBalance, getTotalIncome, getTotalExpenses, getNetCashFlow, validateTransfer } from "@/store/finance";
import { buildAccount, buildTransaction, resetCounter } from "@/test/factories";

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

describe("Finance workflow — transactions", () => {
  it("creates income and expense transactions affecting balance", () => {
    const account = buildAccount({ name: "Checking", openingBalance: 100000 });
    useFinanceStore.getState().addAccount(account);

    const income = buildTransaction({
      description: "Salary",
      amount: 50000,
      type: "income",
      account: "Checking",
      category: "Salary",
    });
    useFinanceStore.getState().addTransaction(income);

    const txns1 = useFinanceStore.getState().transactions;
    expect(txns1).toHaveLength(1);

    const expense = buildTransaction({
      description: "Groceries",
      amount: 15000,
      type: "expense",
      account: "Checking",
      category: "Food",
    });
    useFinanceStore.getState().addTransaction(expense);

    const all = useFinanceStore.getState().transactions;
    expect(all).toHaveLength(2);

    const balance = getTotalBalance(
      useFinanceStore.getState().accounts,
      useFinanceStore.getState().transactions,
    );
    expect(balance).toBe(135000);
  });

  it("edits a transaction", () => {
    const tx = buildTransaction({ description: "Shopping", amount: 5000 });
    useFinanceStore.getState().addTransaction(tx);

    useFinanceStore.getState().updateTransaction(tx.id, { amount: 8000, description: "Shopping Updated" });

    const updated = useFinanceStore.getState().transactions[0];
    expect(updated.amount).toBe(8000);
    expect(updated.description).toBe("Shopping Updated");
  });

  it("deletes a transaction", () => {
    const tx = buildTransaction({ description: "Temporary", amount: 1000 });
    useFinanceStore.getState().addTransaction(tx);
    expect(useFinanceStore.getState().transactions).toHaveLength(1);

    useFinanceStore.getState().deleteTransaction(tx.id);
    expect(useFinanceStore.getState().transactions).toHaveLength(0);
  });

  it("transfers between accounts", () => {
    const acc1 = buildAccount({ name: "Savings", openingBalance: 200000 });
    const acc2 = buildAccount({ name: "Checking", openingBalance: 50000 });
    useFinanceStore.getState().addAccount(acc1);
    useFinanceStore.getState().addAccount(acc2);

    const transfer = buildTransaction({
      description: "Transfer to Checking",
      amount: 30000,
      type: "transfer",
      fromAccount: "Savings",
      toAccount: "Checking",
      category: "Transfer",
    });
    useFinanceStore.getState().addTransaction(transfer);

    const all = useFinanceStore.getState().transactions;
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe("transfer");

    const validation = validateTransfer(all[0], useFinanceStore.getState().accounts);
    expect(validation.valid).toBe(true);
  });

  it("supports CRUD lifecycle", () => {
    const tx = buildTransaction({ description: "CRUD Test", amount: 5000 });
    expect(useFinanceStore.getState().transactions).toHaveLength(0);

    useFinanceStore.getState().addTransaction(tx);
    expect(useFinanceStore.getState().transactions).toHaveLength(1);

    useFinanceStore.getState().updateTransaction(tx.id, { amount: 7000 });
    expect(useFinanceStore.getState().transactions[0].amount).toBe(7000);

    useFinanceStore.getState().deleteTransaction(tx.id);
    expect(useFinanceStore.getState().transactions).toHaveLength(0);
  });

  it("calculates totals from multiple transactions", () => {
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 100000, type: "income", category: "Salary" }));
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 20000, type: "expense", category: "Food" }));
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 15000, type: "expense", category: "Transport" }));
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 50000, type: "income", category: "Freelance" }));

    const txns = useFinanceStore.getState().transactions;
    expect(getTotalIncome(txns)).toBe(150000);
    expect(getTotalExpenses(txns)).toBe(35000);
    expect(getNetCashFlow(txns)).toBe(115000);
  });
});
