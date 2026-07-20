import { describe, it, expect } from "vitest";
import {
  transactionSchema,
  budgetSchema,
  goalSchema,
  debtSchema,
  accountSchema,
  toTransactionPayload,
  toBudgetPayload,
  toGoalPayload,
  toDebtPayload,
  toAccountPayload,
} from "./schemas";

describe("transactionSchema", () => {
  it("validates a valid expense transaction", () => {
    const result = transactionSchema.safeParse({
      date: "2024-06-15",
      description: "Lunch",
      category: "Food",
      account: "Main",
      amount: 5000,
      type: "expense",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing description", () => {
    const result = transactionSchema.safeParse({
      date: "2024-06-15",
      description: "",
      category: "Food",
      account: "Main",
      amount: 5000,
      type: "expense",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = transactionSchema.safeParse({
      date: "2024-06-15",
      description: "Test",
      category: "Food",
      account: "Main",
      amount: 0,
      type: "expense",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = transactionSchema.safeParse({
      date: "2024-06-15",
      description: "Test",
      category: "Food",
      account: "Main",
      amount: -100,
      type: "expense",
    });
    expect(result.success).toBe(false);
  });

  it("requires fromAccount and toAccount for transfer", () => {
    const result = transactionSchema.safeParse({
      date: "2024-06-15",
      description: "Transfer",
      category: "Transfer",
      amount: 5000,
      type: "transfer",
    });
    expect(result.success).toBe(false);
  });

  it("rejects same source and destination", () => {
    const result = transactionSchema.safeParse({
      date: "2024-06-15",
      description: "Transfer",
      category: "Transfer",
      amount: 5000,
      type: "transfer",
      fromAccount: "Main",
      toAccount: "Main",
    });
    expect(result.success).toBe(false);
  });

  it("validates a valid transfer", () => {
    const result = transactionSchema.safeParse({
      date: "2024-06-15",
      description: "Transfer",
      category: "Transfer",
      amount: 5000,
      type: "transfer",
      fromAccount: "Checking",
      toAccount: "Savings",
    });
    expect(result.success).toBe(true);
  });

  it("requires account for non-transfer", () => {
    const result = transactionSchema.safeParse({
      date: "2024-06-15",
      description: "Test",
      category: "Food",
      amount: 5000,
      type: "expense",
    });
    expect(result.success).toBe(false);
  });
});

describe("budgetSchema", () => {
  it("validates a valid budget", () => {
    const result = budgetSchema.safeParse({
      name: "Food Budget",
      category: "Food",
      icon: "shopping-cart",
      amount: 50000,
      period: "Monthly",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = budgetSchema.safeParse({
      name: "",
      category: "Food",
      icon: "shopping-cart",
      amount: 50000,
      period: "Monthly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = budgetSchema.safeParse({
      name: "Test",
      category: "Food",
      icon: "shopping-cart",
      amount: 0,
      period: "Monthly",
    });
    expect(result.success).toBe(false);
  });

  it("requires start/end dates for Custom period", () => {
    const result = budgetSchema.safeParse({
      name: "Test",
      category: "Food",
      icon: "shopping-cart",
      amount: 50000,
      period: "Custom",
    });
    expect(result.success).toBe(false);
  });

  it("validates Custom period with dates", () => {
    const result = budgetSchema.safeParse({
      name: "Test",
      category: "Food",
      icon: "shopping-cart",
      amount: 50000,
      period: "Custom",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
    expect(result.success).toBe(true);
  });
});

describe("goalSchema", () => {
  it("validates a valid goal", () => {
    const result = goalSchema.safeParse({
      name: "Save for car",
      targetAmount: 1000000,
      targetDate: "2025-12-31",
      startDate: "2024-01-01",
      fundingType: "Mixed",
      icon: "car",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = goalSchema.safeParse({
      name: "",
      targetAmount: 1000000,
      targetDate: "2025-12-31",
      startDate: "2024-01-01",
      fundingType: "Mixed",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero target", () => {
    const result = goalSchema.safeParse({
      name: "Test",
      targetAmount: 0,
      targetDate: "2025-12-31",
      startDate: "2024-01-01",
      fundingType: "Mixed",
    });
    expect(result.success).toBe(false);
  });
});

describe("debtSchema", () => {
  it("validates a valid debt", () => {
    const result = debtSchema.safeParse({
      name: "Car Loan",
      lender: "Bank",
      originalAmount: 500000,
      dueDate: "2025-12-31",
      startDate: "2024-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = debtSchema.safeParse({
      name: "",
      lender: "Bank",
      originalAmount: 500000,
      dueDate: "2025-12-31",
      startDate: "2024-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative original amount", () => {
    const result = debtSchema.safeParse({
      name: "Test",
      lender: "Bank",
      originalAmount: -100,
      dueDate: "2025-12-31",
      startDate: "2024-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("defaults missing optional fields", () => {
    const result = debtSchema.safeParse({
      name: "Test",
      lender: "Bank",
      originalAmount: 500000,
      dueDate: "2025-12-31",
      startDate: "2024-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interestRate).toBe(0);
      expect(result.data.minimumPayment).toBe(0);
      expect(result.data.debtType).toBe("Loan");
      expect(result.data.repaymentType).toBe("Fixed");
    }
  });
});

describe("accountSchema", () => {
  it("validates a valid account", () => {
    const result = accountSchema.safeParse({
      name: "Main",
      bank: "GTBank",
      type: "bank",
      currency: "NGN",
      color: "#3b82f6",
      icon: "wallet",
      openingBalance: 10000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = accountSchema.safeParse({
      name: "",
      bank: "GTBank",
      type: "bank",
      currency: "NGN",
      color: "#3b82f6",
      icon: "wallet",
      openingBalance: 10000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = accountSchema.safeParse({
      name: "Test",
      bank: "GTBank",
      type: "invalid",
      currency: "NGN",
      color: "#3b82f6",
      icon: "wallet",
      openingBalance: 10000,
    });
    expect(result.success).toBe(false);
  });
});

describe("payload converters", () => {
  describe("toTransactionPayload", () => {
    it("converts valid form values", () => {
      const payload = toTransactionPayload({
        date: "2024-06-15",
        description: "Lunch",
        category: "Food",
        account: "Main",
        amount: 5000,
        type: "expense",
        notes: "",
        attachments: [],
        receiptUrl: "",
        fromAccount: "",
        toAccount: "",
        tags: "",
        merchant: "",
        budgetId: "",
        debtId: "",
      });
      expect(payload.description).toBe("Lunch");
      expect(payload.amount).toBe(5000);
      expect(payload.type).toBe("expense");
    });

    it("handles string attachments", () => {
      const payload = toTransactionPayload({
        date: "2024-06-15",
        description: "Test",
        category: "Food",
        account: "Main",
        amount: 5000,
        type: "expense",
        notes: "",
        attachments: "a.jpg,b.jpg",
        receiptUrl: "",
        fromAccount: "",
        toAccount: "",
        tags: "",
        merchant: "",
        budgetId: "",
        debtId: "",
      });
      expect(payload.attachments).toEqual(["a.jpg", "b.jpg"]);
    });

    it("sets transfer fields for transfer type", () => {
      const payload = toTransactionPayload({
        date: "2024-06-15",
        description: "Transfer",
        category: "Transfer",
        account: "",
        amount: 5000,
        type: "transfer",
        notes: "",
        attachments: [],
        receiptUrl: "",
        fromAccount: "Checking",
        toAccount: "Savings",
        tags: "transfer,internal",
        merchant: "",
        budgetId: "",
        debtId: "",
      });
      expect(payload.fromAccount).toBe("Checking");
      expect(payload.toAccount).toBe("Savings");
      expect(payload.tags).toEqual(["transfer", "internal"]);
    });
  });

  describe("toBudgetPayload", () => {
    it("converts valid form values", () => {
      const payload = toBudgetPayload({
        name: "Food Budget",
        category: "Food",
        icon: "shopping-cart",
        amount: 50000,
        period: "Monthly",
        color: "",
        startDate: "",
        endDate: "",
        notes: "",
        accounts: "",
        wallets: "",
        tags: "",
      });
      expect(payload.name).toBe("Food Budget");
      expect(payload.amount).toBe(50000);
      expect(payload.period).toBe("Monthly");
    });

    it("parses CSV list fields", () => {
      const payload = toBudgetPayload({
        name: "Test",
        category: "Food",
        icon: "tag",
        amount: 50000,
        period: "Monthly",
        color: "",
        startDate: "",
        endDate: "",
        notes: "",
        accounts: "Main, Savings",
        wallets: "",
        tags: "groceries",
      });
      expect(payload.accounts).toEqual(["Main", "Savings"]);
      expect(payload.tags).toEqual(["groceries"]);
    });
  });

  describe("toGoalPayload", () => {
    it("converts valid form values", () => {
      const payload = toGoalPayload({
        name: "Save for car",
        targetAmount: 1000000,
        targetDate: "2025-12-31",
        startDate: "2024-01-01",
        fundingType: "Mixed",
        categories: "Car, Maintenance",
        accounts: "",
        wallets: "",
        tags: "",
        color: "#8b5cf6",
        icon: "car",
        priority: "high",
        notes: "",
        autoTrack: true,
        includeTransfers: false,
      });
      expect(payload.name).toBe("Save for car");
      expect(payload.targetAmount).toBe(1000000);
      expect(payload.categories).toEqual(["Car", "Maintenance"]);
      expect(payload.priority).toBe("high");
    });
  });

  describe("toDebtPayload", () => {
    it("converts valid form values", () => {
      const payload = toDebtPayload({
        name: "Car Loan",
        lender: "Bank",
        originalAmount: 500000,
        interestRate: 10,
        debtType: "Loan",
        repaymentType: "Fixed",
        minimumPayment: 10000,
        dueDate: "2025-12-31",
        startDate: "2024-01-01",
        categories: "",
        accounts: "",
        wallets: "",
        tags: "",
        color: "#ef4444",
        icon: "credit-card",
        notes: "",
        includeTransfers: false,
      });
      expect(payload.name).toBe("Car Loan");
      expect(payload.originalAmount).toBe(500000);
      expect(payload.interestRate).toBe(10);
    });
  });

  describe("toAccountPayload", () => {
    it("converts valid form values", () => {
      const payload = toAccountPayload({
        name: "Main",
        bank: "GTBank",
        type: "bank",
        currency: "NGN",
        color: "#3b82f6",
        icon: "wallet",
        openingBalance: 10000,
        notes: "",
      });
      expect(payload.name).toBe("Main");
      expect(payload.openingBalance).toBe(10000);
      expect(payload.balance).toBe(10000);
      expect(payload.type).toBe("bank");
    });
  });
});
