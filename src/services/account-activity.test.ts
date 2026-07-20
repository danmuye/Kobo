import { describe, it, expect } from "vitest";
import {
  getAccountActivityLevel,
  getAccountsActivity,
  DEFAULT_ACTIVITY_RULES,
  type ActivityLevel,
} from "./account-activity";
import { buildAccount, buildTransaction } from "@/test/factories";
import type { Transaction, Account } from "@/types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe("getAccountActivityLevel", () => {
  describe("brand new account (no transactions)", () => {
    it("returns inactive", () => {
      const level = getAccountActivityLevel("My Account", []);
      expect(level).toBe("inactive");
    });
  });

  describe("one recent transaction", () => {
    it("returns active if within 7 days", () => {
      const txs = [buildTransaction({ account: "My Account", date: daysAgo(1) })];
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("active");
    });

    it("returns active if within 7 days at boundary (day 6)", () => {
      const txs = [buildTransaction({ account: "My Account", date: daysAgo(6) })];
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("active");
    });

    it("returns low if within 30 days but outside 7", () => {
      const txs = [buildTransaction({ account: "My Account", date: daysAgo(10) })];
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("low");
    });

    it("returns low if within 30 days at boundary (day 29)", () => {
      const txs = [buildTransaction({ account: "My Account", date: daysAgo(29) })];
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("low");
    });

    it("returns inactive if older than 30 days", () => {
      const txs = [buildTransaction({ account: "My Account", date: daysAgo(31) })];
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("inactive");
    });
  });

  describe("multiple recent transactions", () => {
    it("returns active with 6+ transactions in 30 days (even if none within 7)", () => {
      const txs: Transaction[] = [];
      for (let i = 0; i < 6; i++) {
        txs.push(buildTransaction({ account: "My Account", date: daysAgo(10 + i) }));
      }
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("active");
    });

    it("returns active with exactly 5 transactions (does not exceed threshold)", () => {
      const txs: Transaction[] = [];
      for (let i = 0; i < 5; i++) {
        txs.push(buildTransaction({ account: "My Account", date: daysAgo(10 + i) }));
      }
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("low");
    });

    it("returns active with 6+ transactions even if some are outside 30-day window", () => {
      const txs: Transaction[] = [];
      for (let i = 0; i < 6; i++) {
        txs.push(buildTransaction({ account: "My Account", date: daysAgo(10 + i) }));
      }
      txs.push(buildTransaction({ account: "My Account", date: daysAgo(60) }));
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("active");
    });
  });

  describe("transfers", () => {
    it("counts transfers from the account", () => {
      const txs = [buildTransaction({ type: "transfer", fromAccount: "My Account", toAccount: "Other", date: daysAgo(1) })];
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("active");
    });

    it("counts transfers to the account", () => {
      const txs = [buildTransaction({ type: "transfer", fromAccount: "Other", toAccount: "My Account", date: daysAgo(1) })];
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("active");
    });

    it("does not count transfers between other accounts", () => {
      const txs = [buildTransaction({ type: "transfer", fromAccount: "A", toAccount: "B", date: daysAgo(1) })];
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("inactive");
    });
  });

  describe("debt payments (stored as expense with debtId)", () => {
    it("counts debt payments as activity", () => {
      const txs = [buildTransaction({ type: "expense", account: "My Account", debtId: "debt-1", date: daysAgo(1) })];
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("active");
    });
  });

  describe("savings contributions (stored as expense with goalId)", () => {
    it("counts savings contributions as activity", () => {
      const txs = [buildTransaction({ type: "expense", account: "My Account", goalId: "goal-1", date: daysAgo(1) })];
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("active");
    });
  });

  describe("custom rules", () => {
    it("uses custom recentActivityDays", () => {
      const txs = [buildTransaction({ account: "My Account", date: daysAgo(5) })];
      const level = getAccountActivityLevel("My Account", txs, {
        ...DEFAULT_ACTIVITY_RULES,
        recentActivityDays: 3,
      });
      expect(level).toBe("low");
    });

    it("uses custom highTransactionCount", () => {
      const txs: Transaction[] = [];
      for (let i = 0; i < 3; i++) {
        txs.push(buildTransaction({ account: "My Account", date: daysAgo(10 + i) }));
      }
      const level = getAccountActivityLevel("My Account", txs, {
        ...DEFAULT_ACTIVITY_RULES,
        highTransactionCount: 2,
      });
      expect(level).toBe("active");
    });

    it("uses custom lowActivityDays", () => {
      const txs = [buildTransaction({ account: "My Account", date: daysAgo(15) })];
      const level = getAccountActivityLevel("My Account", txs, {
        ...DEFAULT_ACTIVITY_RULES,
        lowActivityDays: 10,
      });
      expect(level).toBe("inactive");
    });
  });

  describe("mixed transaction history", () => {
    it("mixes income, expense, and transfer correctly", () => {
      const txs: Transaction[] = [
        buildTransaction({ type: "income", account: "My Account", date: daysAgo(2) }),
        buildTransaction({ type: "expense", account: "My Account", date: daysAgo(5) }),
        buildTransaction({ type: "transfer", fromAccount: "Other", toAccount: "My Account", date: daysAgo(3) }),
        buildTransaction({ type: "transfer", fromAccount: "My Account", toAccount: "Other", date: daysAgo(1) }),
        buildTransaction({ type: "expense", account: "Other", date: daysAgo(1) }), // not for My Account
      ];
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("active");
    });
  });

  describe("old transactions only", () => {
    it("returns inactive if all transactions are older than 30 days", () => {
      const txs: Transaction[] = [
        buildTransaction({ account: "My Account", date: daysAgo(35) }),
        buildTransaction({ account: "My Account", date: daysAgo(40) }),
        buildTransaction({ account: "My Account", date: daysAgo(60) }),
      ];
      const level = getAccountActivityLevel("My Account", txs);
      expect(level).toBe("inactive");
    });
  });

  describe("edge cases", () => {
    it("handles empty transactions array", () => {
      const level = getAccountActivityLevel("My Account", []);
      expect(level).toBe("inactive");
    });

    it("handles null/undefined transactions gracefully", () => {
      const level = getAccountActivityLevel("My Account", null as unknown as Transaction[]);
      expect(level).toBe("inactive");
    });
  });
});

describe("getAccountsActivity", () => {
  it("returns results for all accounts", () => {
    const accounts: Account[] = [
      buildAccount({ id: "a1", name: "Active Account" }),
      buildAccount({ id: "a2", name: "Inactive Account" }),
    ];
    const txs = [buildTransaction({ account: "Active Account", date: daysAgo(1) })];
    const results = getAccountsActivity(accounts, txs);
    expect(results).toHaveLength(2);
    const activeResult = results.find((r) => r.accountName === "Active Account");
    const inactiveResult = results.find((r) => r.accountName === "Inactive Account");
    expect(activeResult?.activityLevel).toBe("active");
    expect(inactiveResult?.activityLevel).toBe("inactive");
  });

  it("shows recentTransactionCount for each account", () => {
    const accounts: Account[] = [
      buildAccount({ id: "a1", name: "A" }),
      buildAccount({ id: "a2", name: "B" }),
    ];
    const txs = [
      buildTransaction({ account: "A", date: daysAgo(1) }),
      buildTransaction({ account: "A", date: daysAgo(5) }),
      buildTransaction({ account: "B", date: daysAgo(10) }),
    ];
    const results = getAccountsActivity(accounts, txs);
    expect(results.find((r) => r.accountName === "A")?.recentTransactionCount).toBe(2);
    expect(results.find((r) => r.accountName === "B")?.recentTransactionCount).toBe(1);
  });
});
