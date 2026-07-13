import { z } from "zod";
import type { Account, AccountType, Budget, Debt, SavingsGoal, Transaction } from "@/types";

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

/** Shape shared by the base budget schema (without cross-budget overlap checks). */
const budgetBaseSchema = z.object({
  name: z.string().min(1, "Budget name is required"),
  category: z.string().min(1, "Category is required"),
  icon: z.string().min(1, "Icon is required"),
  amount: z.number({ invalid_type_error: "Enter a valid amount" })
    .finite("Amount must be a finite number")
    .positive("Budget amount must be greater than 0"),
  spent: z.number({ invalid_type_error: "Enter a valid amount" })
    .finite("Spent must be a finite number")
    .nonnegative("Spent cannot be negative"),
  period: z.enum(["weekly", "monthly", "yearly"], { errorMap: () => ({ message: "Select a budget period" }) }),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
});

/** Adds date-range validation (valid dates, end after start) to the base schema. */
function withDateRangeValidation<T extends typeof budgetBaseSchema>(schema: T) {
  return schema.superRefine((values, ctx) => {
    const { startDate, endDate } = values;

    // If only one of the pair is provided, the range is incomplete
    if (startDate && !endDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "End date is required when a start date is set" });
    }
    if (endDate && !startDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startDate"], message: "Start date is required when an end date is set" });
    }

    if (startDate) {
      const start = new Date(startDate);
      if (Number.isNaN(start.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startDate"], message: "Invalid start date" });
      } else {
        // Reject start dates in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startDate"], message: "Start date cannot be in the past" });
        }
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
}

/** Default budget schema — no overlap checking against other budgets. */
export const budgetSchema = withDateRangeValidation(budgetBaseSchema);

/**
 * Builds a budget schema that additionally rejects overlapping budget periods
 * for the same category:
 * - Two budgets with custom date ranges in the same category cannot have
 *   overlapping start/end windows.
 * - Two recurring budgets (no custom dates) in the same category with the
 *   same period (weekly/monthly/yearly) are considered duplicates.
 *
 * @param existingBudgets Budgets already in the store.
 * @param excludeId Id of the budget being edited (excluded from the overlap check).
 */
export function createBudgetSchema(existingBudgets: Budget[], excludeId?: string) {
  return withDateRangeValidation(budgetBaseSchema).superRefine((values, ctx) => {
    const others = existingBudgets.filter((b) => b.id !== excludeId && b.category === values.category);
    if (others.length === 0) return;

    const hasCustomRange = Boolean(values.startDate && values.endDate);
    const newStart = hasCustomRange ? new Date(values.startDate).getTime() : undefined;
    const newEnd = hasCustomRange ? new Date(values.endDate).getTime() : undefined;

    for (const other of others) {
      const otherHasCustomRange = Boolean(other.startDate && other.endDate);

      if (hasCustomRange && otherHasCustomRange) {
        const otherStart = new Date(other.startDate!).getTime();
        const otherEnd = new Date(other.endDate!).getTime();
        const overlaps = newStart! <= otherEnd && otherStart <= newEnd!;
        if (overlaps) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["startDate"],
            message: `Overlaps with "${other.name}" (${other.startDate} – ${other.endDate}) in the same category`,
          });
          return;
        }
      } else if (!hasCustomRange && !otherHasCustomRange && other.period === values.period) {
        // Two recurring budgets, same category, same period = duplicate
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["category"],
          message: `A ${values.period} budget for "${values.category}" already exists ("${other.name}")`,
        });
        return;
      }
    }
  });
}

export const goalSchema = z.object({
  name: z.string().min(1, "Goal name is required"),
  target: z.number({ invalid_type_error: "Enter a valid amount" })
    .finite("Target must be a finite number")
    .positive("Target must be greater than 0"),
  saved: z.number({ invalid_type_error: "Enter a valid amount" })
    .finite("Saved amount must be a finite number")
    .nonnegative("Saved amount cannot be negative"),
  deadline: z.string().min(1, "Deadline is required"),
  icon: z.string().min(1, "Icon is required"),
}).superRefine((values, ctx) => {
  // Saved cannot exceed target
  if (values.saved > values.target) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["saved"],
      message: `Saved amount (${values.saved.toLocaleString()}) cannot exceed the target (${values.target.toLocaleString()})`,
    });
  }

  // Deadline must be in the future
  const deadline = new Date(values.deadline);
  if (!Number.isNaN(deadline.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadline <= today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadline"],
        message: "Deadline must be a future date",
      });
    }
  }
});

export const debtSchema = z.object({
  name: z.string().min(1, "Debt name is required"),
  lender: z.string().min(1, "Lender is required"),
  balance: z.number().nonnegative("Balance cannot be negative"),
  originalAmount: z.number().nonnegative("Original amount cannot be negative"),
  interestRate: z.number().nonnegative("Interest rate cannot be negative"),
  minPayment: z.number().nonnegative("Minimum payment cannot be negative"),
  dueDate: z.string().min(1, "Due date is required"),
});

export const accountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  bank: z.string().min(1, "Bank or provider is required"),
  type: z.enum(["bank", "credit_card", "mobile_wallet", "cash", "investment"] as [AccountType, ...AccountType[]], { errorMap: () => ({ message: "Select an account type" }) }),
  balance: z.number().nonnegative("Balance cannot be negative"),
  currency: z.string().min(1, "Currency is required"),
  color: z.string().min(1, "Color is required"),
  icon: z.string().min(1, "Icon is required"),
  openingBalance: z.number().nonnegative("Opening balance cannot be negative"),
  notes: z.string().max(500).optional().default(""),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
export type BudgetFormValues = z.infer<typeof budgetSchema>;
export type GoalFormValues = z.infer<typeof goalSchema>;
export type DebtFormValues = z.infer<typeof debtSchema>;
export type AccountFormValues = z.infer<typeof accountSchema>;

export const toTransactionPayload = (values: TransactionFormValues): Omit<Transaction, "id"> => {
  const attachments = Array.isArray(values.attachments)
    ? values.attachments
    : values.attachments
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

  return {
    date: new Date(values.date).toISOString(),
    description: values.description,
    category: values.category,
    account: values.type === "transfer" ? values.fromAccount?.trim() ?? "" : values.account,
    amount: values.amount,
    type: values.type,
    notes: values.notes ?? "",
    attachments,
    receiptUrl: values.receiptUrl || null,
    fromAccount: values.type === "transfer" ? values.fromAccount?.trim() || undefined : undefined,
    toAccount: values.type === "transfer" ? values.toAccount?.trim() || undefined : undefined,
  };
};

export const toBudgetPayload = (values: BudgetFormValues): Omit<Budget, "id"> => ({
  name: values.name,
  category: values.category,
  icon: values.icon,
  amount: values.amount,
  spent: values.spent,
  period: values.period,
  startDate: values.startDate || undefined,
  endDate: values.endDate || undefined,
});
export const toGoalPayload = (values: GoalFormValues): Omit<SavingsGoal, "id"> => ({
  name: values.name,
  target: values.target,
  saved: values.saved,
  deadline: values.deadline,
  icon: values.icon,
  createdAt: new Date().toISOString(),
});
export const toDebtPayload = (values: DebtFormValues): Omit<Debt, "id"> => ({
  name: values.name,
  lender: values.lender,
  balance: values.balance,
  originalAmount: values.originalAmount,
  interestRate: values.interestRate,
  minPayment: values.minPayment,
  dueDate: values.dueDate,
});
export const toAccountPayload = (values: AccountFormValues): Omit<Account, "id"> => ({
  name: values.name,
  bank: values.bank,
  type: values.type,
  balance: values.balance,
  currency: values.currency,
  color: values.color,
  icon: values.icon,
  openingBalance: values.openingBalance,
  notes: values.notes || undefined,
});
