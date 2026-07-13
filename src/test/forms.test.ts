import { describe, expect, it } from "vitest";
import { accountSchema, transactionSchema } from "@/features/forms/schemas";

describe("form schemas", () => {
  it("requires a positive transaction amount and a description", () => {
    const result = transactionSchema.safeParse({
      date: "",
      description: "",
      category: "",
      account: "",
      amount: 0,
      type: "expense",
      notes: "",
      attachments: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.description).toContain("Description is required");
      expect(result.error.flatten().fieldErrors.amount).toContain("Amount must be greater than 0");
    }
  });

  it("accepts transfer transactions with the required account pair", () => {
    const result = transactionSchema.safeParse({
      date: "2026-06-30",
      description: "Transfer to savings",
      category: "Transfer",
      account: "Salary Account",
      fromAccount: "Salary Account",
      toAccount: "Opay Wallet",
      amount: 25000,
      type: "transfer",
      notes: "Moved money",
      attachments: [],
    });

    expect(result.success).toBe(true);
  });

  it("validates account names and balances", () => {
    const result = accountSchema.safeParse({
      name: "",
      bank: "",
      type: "bank",
      balance: -100,
      currency: "NGN",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toContain("Account name is required");
      expect(result.error.flatten().fieldErrors.balance).toContain("Balance cannot be negative");
    }
  });
});
