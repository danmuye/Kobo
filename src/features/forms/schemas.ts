import { z } from "zod";
import type { Account, AccountType, Budget, Debt, Goal, Transaction } from "@/types";

const attachmentValueSchema = z.union([z.array(z.string()), z.string()]).optional().default([]);

export const transactionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  account: z.string().default(""),
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["income", "expense", "transfer"], { errorMap: () => ({ message: "Select a transaction type" }) }),
  notes: z.string().max(500).optional().default(""),
  attachments: attachmentValueSchema,
  receiptUrl: z.string().optional().default(""),
  fromAccount: z.string().optional().default(""),
  toAccount: z.string().optional().default(""),
  tags: z.string().optional().default(""),
  merchant: z.string().optional().default(""),
  budgetId: z.string().optional().default(""),
  debtId: z.string().optional().default(""),
}).superRefine((values, ctx) => {
  if (values.type === "transfer") {
    if (!values.fromAccount?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fromAccount"], message: "Source account is required" });
    }
    if (!values.toAccount?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["toAccount"], message: "Destination account is required" });
    }
    if (values.fromAccount?.trim() && values.toAccount?.trim() && values.fromAccount.trim() === values.toAccount.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["toAccount"], message: "Choose a different destination account" });
    }
    return;
  }

  if (!values.account?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["account"], message: "Account is required" });
  }
});

export const budgetSchema = z.object({
  name: z.string().min(1, "Budget name is required"),
  category: z.string().min(1, "Category is required"),
  icon: z.string().min(1, "Icon is required"),
  amount: z.number({ invalid_type_error: "Enter a valid amount" })
    .finite("Amount must be a finite number")
    .positive("Budget amount must be greater than 0"),
  period: z.enum(["Monthly", "Weekly", "Yearly", "Custom"], { errorMap: () => ({ message: "Select a budget period" }) }),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  color: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  accounts: z.string().optional().default(""),
  wallets: z.string().optional().default(""),
  tags: z.string().optional().default(""),
}).superRefine((values, ctx) => {
  const { startDate, endDate } = values;

  if (values.period === "Custom") {
    if (!startDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startDate"], message: "Start date is required for custom period" });
    if (!endDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "End date is required for custom period" });
  }

  if (startDate) {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startDate"], message: "Invalid start date" });
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "Invalid end date" });
    } else if (startDate) {
      const start = new Date(startDate);
      if (!Number.isNaN(start.getTime()) && end <= start) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "End date must be after start date" });
      }
    }
  }
});

export const goalSchema = z.object({
  name: z.string().min(1, "Goal name is required"),
  targetAmount: z.number({ invalid_type_error: "Enter a valid amount" })
    .finite("Target must be a finite number")
    .positive("Target must be greater than 0"),
  targetDate: z.string().min(1, "Target date is required"),
  startDate: z.string().min(1, "Start date is required"),
  fundingType: z.enum(["Income", "Savings Transfer", "Manual Deposit", "Mixed"]),
  categories: z.string().optional().default(""),
  accounts: z.string().optional().default(""),
  wallets: z.string().optional().default(""),
  tags: z.string().optional().default(""),
  color: z.string().optional().default("#8b5cf6"),
  icon: z.string().min(1, "Icon is required"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  notes: z.string().optional().default(""),
  autoTrack: z.boolean().optional().default(true),
  includeTransfers: z.boolean().optional().default(false),
});

const debtTypeOptions = ["Loan", "Credit Card", "Mortgage", "Personal", "Business", "Other"] as const;
const repaymentTypeOptions = ["Fixed", "Minimum", "Interest Only", "Custom"] as const;

export const debtSchema = z.object({
  name: z.string().min(1, "Debt name is required"),
  lender: z.string().min(1, "Lender is required"),
  originalAmount: z.number({ invalid_type_error: "Enter a valid amount" })
    .finite("Amount must be a finite number")
    .nonnegative("Original amount cannot be negative"),
  interestRate: z.number().nonnegative("Interest rate cannot be negative").optional().default(0),
  debtType: z.enum(debtTypeOptions, { errorMap: () => ({ message: "Select a debt type" }) }).default("Loan"),
  repaymentType: z.enum(repaymentTypeOptions, { errorMap: () => ({ message: "Select a repayment type" }) }).default("Fixed"),
  minimumPayment: z.number().nonnegative("Minimum payment cannot be negative").default(0),
  dueDate: z.string().min(1, "Due date is required"),
  startDate: z.string().min(1, "Start date is required"),
  categories: z.string().optional().default(""),
  accounts: z.string().optional().default(""),
  wallets: z.string().optional().default(""),
  tags: z.string().optional().default(""),
  color: z.string().optional().default("#ef4444"),
  icon: z.string().optional().default("credit-card"),
  notes: z.string().optional().default(""),
  includeTransfers: z.boolean().optional().default(false),
});

export const accountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  bank: z.string().min(1, "Bank or provider is required"),
  type: z.enum(["bank", "credit_card", "mobile_wallet", "cash", "investment"] as [AccountType, ...AccountType[]], { errorMap: () => ({ message: "Select an account type" }) }),
  currency: z.string().min(1, "Currency is required"),
  color: z.string().min(1, "Color is required"),
  icon: z.string().min(1, "Icon is required"),
  openingBalance: z.number().nonnegative("Opening balance cannot be negative"),
  notes: z.string().max(500).optional().default(""),
});

export type DebtFormValues = z.infer<typeof debtSchema>;
export type TransactionFormValues = z.infer<typeof transactionSchema>;
export type BudgetFormValues = z.infer<typeof budgetSchema>;
export type GoalFormValues = z.infer<typeof goalSchema>;

function splitCsv(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
export type AccountFormValues = z.infer<typeof accountSchema>;

export const toTransactionPayload = (values: TransactionFormValues): Omit<Transaction, "id"> => {
  const attachments = Array.isArray(values.attachments)
    ? values.attachments
    : values.attachments
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

  const payload: Omit<Transaction, "id"> = {
    date: new Date(values.date).toISOString(),
    description: values.description,
    category: values.category,
    account: values.type === "transfer" ? values.fromAccount?.trim() ?? "" : values.account,
    amount: values.amount,
    type: values.type,
    notes: values.notes ?? "",
    attachments,
    receiptUrl: values.receiptUrl || null,
  };
  if (values.type === "transfer") {
    payload.fromAccount = values.fromAccount?.trim() || "";
    payload.toAccount = values.toAccount?.trim() || "";
  }
  if (values.tags) {
    payload.tags = values.tags.split(",").map((t) => t.trim()).filter(Boolean);
  }
  if (values.merchant) {
    payload.merchant = values.merchant.trim();
  }
  payload.budgetId = values.budgetId || null;
  payload.debtId = values.debtId || null;
  return payload;
};

export const toBudgetPayload = (values: BudgetFormValues): Omit<Budget, "id"> => {
  const now = new Date().toISOString();
  const payload: Omit<Budget, "id"> = {
    name: values.name,
    categories: values.category ? [values.category] : [],
    icon: values.icon,
    amount: values.amount,
    period: values.period,
    color: values.color || "#3b82f6",
    createdAt: now,
    updatedAt: now,
  };
  if (values.startDate) payload.startDate = values.startDate;
  if (values.endDate) payload.endDate = values.endDate;
  if (values.notes) payload.notes = values.notes;
  if (values.accounts) payload.accounts = splitCsv(values.accounts);
  if (values.wallets) payload.wallets = splitCsv(values.wallets);
  if (values.tags) payload.tags = splitCsv(values.tags);
  return payload;
};
export const toGoalPayload = (values: GoalFormValues): Omit<Goal, "id"> => {
  const now = new Date().toISOString();
  return {
    name: values.name,
    targetAmount: values.targetAmount,
    targetDate: values.targetDate,
    startDate: values.startDate,
    fundingType: values.fundingType,
    categories: splitCsv(values.categories),
    accounts: splitCsv(values.accounts),
    wallets: splitCsv(values.wallets),
    tags: splitCsv(values.tags),
    color: values.color || "#8b5cf6",
    icon: values.icon,
    priority: values.priority,
    notes: values.notes,
    autoTrack: values.autoTrack,
    includeTransfers: values.includeTransfers,
    createdAt: now,
    updatedAt: now,
  };
};
export const toDebtPayload = (values: DebtFormValues): Omit<Debt, "id"> => {
  const now = new Date().toISOString();
  return {
    name: values.name,
    lender: values.lender,
    originalAmount: values.originalAmount,
    interestRate: values.interestRate ?? 0,
    debtType: values.debtType,
    repaymentType: values.repaymentType,
    minimumPayment: values.minimumPayment,
    dueDate: values.dueDate,
    startDate: values.startDate,
    categories: splitCsv(values.categories),
    accounts: splitCsv(values.accounts),
    wallets: splitCsv(values.wallets),
    tags: splitCsv(values.tags),
    color: values.color || "#ef4444",
    icon: values.icon || "credit-card",
    notes: values.notes,
    includeTransfers: values.includeTransfers,
    createdAt: now,
    updatedAt: now,
  };
};
export const toAccountPayload = (values: AccountFormValues): Omit<Account, "id"> => {
  const now = new Date().toISOString();
  const payload: Omit<Account, "id"> = {
    name: values.name,
    bank: values.bank,
    type: values.type,
    balance: values.openingBalance,
    currency: values.currency,
    color: values.color,
    icon: values.icon,
    openingBalance: values.openingBalance,
    notes: values.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  return payload;
};
