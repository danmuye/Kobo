import { describe, expect, it } from "vitest";
import { filterAndSortTransactions, paginateTransactions } from "@/features/dashboard/utils";

describe("dashboard transaction utilities", () => {
  const transactions = [
    { id: "1", date: "2026-06-10", description: "Groceries", category: "Food & Dining", account: "Main", amount: 12000, type: "expense" as const },
    { id: "2", date: "2026-06-12", description: "Salary", category: "Salary", account: "Main", amount: 250000, type: "income" as const },
    { id: "3", date: "2026-06-05", description: "Transport", category: "Transportation", account: "Wallet", amount: 5000, type: "expense" as const },
  ];

  it("filters and sorts transactions for the dashboard view", () => {
    const result = filterAndSortTransactions(transactions, "gro", "expense", "amount-desc");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("paginates the filtered transaction list", () => {
    const filtered = filterAndSortTransactions(transactions, "", "all", "date-desc");
    const page = paginateTransactions(filtered, 2, 2);
    expect(page.items).toHaveLength(1);
    expect(page.totalPages).toBe(2);
    expect(page.items[0].id).toBe("3");
  });
});
