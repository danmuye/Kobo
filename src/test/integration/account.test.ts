import { describe, it, expect, beforeEach } from "vitest";
import { useFinanceStore, getTotalBalance, getAccountsByType, getAccountsHealth } from "@/store/finance";
import { buildAccount, buildTransaction, resetCounter } from "@/test/factories";
import { computeAccountBalance } from "@/services/account-balance";

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

describe("Accounts workflow", () => {
  it("creates an account", () => {
    useFinanceStore.getState().addAccount(buildAccount({
      name: "Checking Account",
      bank: "Access Bank",
      type: "bank",
      openingBalance: 100000,
    }));

    const accounts = useFinanceStore.getState().accounts;
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe("Checking Account");
    expect(accounts[0].openingBalance).toBe(100000);
  });

  it("edits an account", () => {
    useFinanceStore.getState().addAccount(buildAccount({ name: "Old Name" }));
    const acct = useFinanceStore.getState().accounts[0];

    useFinanceStore.getState().updateAccount(acct.id, { name: "Updated Name" });

    expect(useFinanceStore.getState().accounts[0].name).toBe("Updated Name");
  });

  it("deletes an account", () => {
    useFinanceStore.getState().addAccount(buildAccount({ name: "Temp" }));
    expect(useFinanceStore.getState().accounts).toHaveLength(1);

    useFinanceStore.getState().deleteAccount(useFinanceStore.getState().accounts[0].id);
    expect(useFinanceStore.getState().accounts).toHaveLength(0);
  });

  it("computes balance from transactions", () => {
    const account = buildAccount({ name: "Main Wallet", openingBalance: 50000 });
    useFinanceStore.getState().addAccount(account);

    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 20000, type: "income", account: "Main Wallet" }));
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 8000, type: "expense", account: "Main Wallet" }));

    const balance = computeAccountBalance(account, useFinanceStore.getState().transactions);
    expect(balance).toBe(62000);
  });

  it("handles transfers between accounts", () => {
    const acc1 = buildAccount({ name: "Source", openingBalance: 100000 });
    const acc2 = buildAccount({ name: "Destination", openingBalance: 50000 });
    useFinanceStore.getState().addAccount(acc1);
    useFinanceStore.getState().addAccount(acc2);

    useFinanceStore.getState().addTransaction(buildTransaction({
      amount: 25000,
      type: "transfer",
      fromAccount: "Source",
      toAccount: "Destination",
      category: "Transfer",
    }));

    const bal1 = computeAccountBalance(acc1, useFinanceStore.getState().transactions);
    const bal2 = computeAccountBalance(acc2, useFinanceStore.getState().transactions);
    expect(bal1).toBe(75000);
    expect(bal2).toBe(75000);
  });

  it("filters accounts by type", () => {
    useFinanceStore.getState().addAccount(buildAccount({ name: "Bank A", type: "bank" }));
    useFinanceStore.getState().addAccount(buildAccount({ name: "Bank B", type: "bank" }));
    useFinanceStore.getState().addAccount(buildAccount({ name: "Cash", type: "cash" }));

    const banks = getAccountsByType(useFinanceStore.getState().accounts, ["bank"]);
    expect(banks).toHaveLength(2);

    const cash = getAccountsByType(useFinanceStore.getState().accounts, ["cash"]);
    expect(cash).toHaveLength(1);
  });

  it("assesses account health", () => {
    useFinanceStore.getState().addAccount(buildAccount({ name: "Healthy", openingBalance: 100000 }));
    useFinanceStore.getState().addAccount(buildAccount({ name: "Low", openingBalance: 1000 }));

    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 50000, type: "expense", account: "Healthy" }));
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 900, type: "expense", account: "Low" }));

    const health = getAccountsHealth(useFinanceStore.getState().accounts, useFinanceStore.getState().transactions);
    expect(health).toHaveLength(2);
    const healthyItem = health.find((h) => h.accountName === "Healthy");
    const lowItem = health.find((h) => h.accountName === "Low");
    expect(healthyItem).toBeDefined();
    expect(lowItem).toBeDefined();
    expect(typeof healthyItem!.growth).toBe("number");
    expect(typeof lowItem!.activityLevel).toBe("string");
  });

  it("supports full CRUD lifecycle", () => {
    expect(useFinanceStore.getState().accounts).toHaveLength(0);

    useFinanceStore.getState().addAccount(buildAccount({ name: "New Account" }));
    expect(useFinanceStore.getState().accounts).toHaveLength(1);

    const a = useFinanceStore.getState().accounts[0];
    useFinanceStore.getState().updateAccount(a.id, { name: "Updated" });
    expect(useFinanceStore.getState().accounts[0].name).toBe("Updated");

    useFinanceStore.getState().deleteAccount(a.id);
    expect(useFinanceStore.getState().accounts).toHaveLength(0);
  });
});
