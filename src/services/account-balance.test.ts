import { describe, it, expect, beforeEach } from "vitest";
import { computeAccountBalance, computeBalances } from "./account-balance";
import { buildAccount, buildTransaction, resetCounter } from "@/test/factories";

beforeEach(() => resetCounter());

describe("computeAccountBalance", () => {
  it("returns opening balance when no transactions", () => {
    const account = buildAccount({ name: "Main", openingBalance: 10000 });
    expect(computeAccountBalance(account, [])).toBe(10000);
  });

  it("adds income transactions", () => {
    const account = buildAccount({ name: "Main", openingBalance: 5000 });
    const txs = [buildTransaction({ type: "income", account: "Main", amount: 1000 })];
    expect(computeAccountBalance(account, txs)).toBe(6000);
  });

  it("subtracts expense transactions", () => {
    const account = buildAccount({ name: "Main", openingBalance: 5000 });
    const txs = [buildTransaction({ type: "expense", account: "Main", amount: 2000 })];
    expect(computeAccountBalance(account, txs)).toBe(3000);
  });

  it("handles transfers", () => {
    const account = buildAccount({ name: "Main", openingBalance: 10000 });
    const txs = [
      buildTransaction({ type: "transfer", fromAccount: "Main", toAccount: "Savings", amount: 3000 }),
      buildTransaction({ type: "transfer", fromAccount: "Other", toAccount: "Main", amount: 2000 }),
    ];
    expect(computeAccountBalance(account, txs)).toBe(9000);
  });

  it("ignores transactions for other accounts", () => {
    const account = buildAccount({ name: "Main", openingBalance: 5000 });
    const txs = [buildTransaction({ type: "expense", account: "Other", amount: 2000 })];
    expect(computeAccountBalance(account, txs)).toBe(5000);
  });
});

describe("computeBalances", () => {
  it("returns empty map for empty accounts", () => {
    const result = computeBalances([], []);
    expect(result.size).toBe(0);
  });

  it("computes balances for each account", () => {
    const accounts = [
      buildAccount({ id: "a1", name: "Main", openingBalance: 10000 }),
      buildAccount({ id: "a2", name: "Savings", openingBalance: 50000 }),
    ];
    const txs = [
      buildTransaction({ type: "income", account: "Main", amount: 5000 }),
      buildTransaction({ type: "expense", account: "Savings", amount: 2000 }),
    ];
    const result = computeBalances(accounts, txs);
    expect(result.get("a1")).toBe(15000);
    expect(result.get("a2")).toBe(48000);
  });
});
