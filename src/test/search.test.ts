import { describe, expect, it } from "vitest";
import { searchFinanceData } from "@/features/search/utils";

describe("global search", () => {
  const data = {
    transactions: [
      { id: "1", date: "2026-06-10", description: "Groceries", category: "Food & Dining", account: "Main", amount: 12000, type: "expense" as const },
    ],
    budgets: [
      { id: "2", name: "Groceries", category: "Food & Dining", icon: "food", amount: 50000, spent: 12000, period: "monthly" as const },
    ],
    accounts: [
      { id: "3", name: "Main Account", bank: "Access Bank", type: "bank" as const, balance: 200000, currency: "NGN" as const },
    ],
    goals: [
      { id: "4", name: "Travel Fund", targetAmount: 1000000, targetDate: "2027-01-01", startDate: "2026-01-01", fundingType: "Mixed" as const, categories: [], accounts: [], wallets: [], tags: [], color: "#8b5cf6", icon: "plane", priority: "medium" as const, notes: "", autoTrack: true, includeTransfers: false, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    ],
    debts: [
      { id: "5", name: "Student Loan", lender: "Access Bank", balance: 100000, originalAmount: 200000, interestRate: 5, minPayment: 10000, dueDate: "2026-12-31" },
    ],
  };

  it("returns matching results from each finance domain", () => {
    const results = searchFinanceData(data, "gro");
    expect(results).toHaveLength(2);
    expect(results[0].kind).toBe("transaction");
    expect(results[1].kind).toBe("budget");
  });

  it("matches account and debt fields", () => {
    const results = searchFinanceData(data, "access");
    expect(results.some((item) => item.kind === "account")).toBe(true);
    expect(results.some((item) => item.kind === "debt")).toBe(true);
  });
});
