export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  date: string; // ISO
  description: string;
  category: string;
  account: string;
  amount: number;
  type: TransactionType;
  notes?: string;
  attachments?: string[];
  receiptUrl?: string | null;
  fromAccount?: string;
  toAccount?: string;
}

export type BudgetStatus = "on-track" | "near-limit" | "exceeded";

export interface BudgetHistoryEntry {
  /** The period this entry covers, e.g. "2026-06" (monthly), "2026-W25" (weekly), "2026" (yearly). */
  periodKey: string;
  /** Amount spent in that period. */
  spent: number;
  /** Budget amount for that period. */
  amount: number;
  /** ISO date when this entry was recorded. */
  date: string;
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  icon: string;
  amount: number;
  spent: number;
  period: "monthly" | "weekly" | "yearly";
  /** Optional custom start date (ISO). When set with endDate, overrides the period-based date logic. */
  startDate?: string;
  /** Optional custom end date (ISO). When set with startDate, overrides the period-based date logic. */
  endDate?: string;
  /** Historical spending snapshots from previous periods. */
  history?: BudgetHistoryEntry[];
}

export interface GoalContributionEntry {
  id: string;
  /** Id of the goal this contribution belongs to. */
  goalId: string;
  /** Amount contributed. */
  amount: number;
  /** ISO date of the contribution. */
  date: string;
  /** Optional note describing the contribution. */
  note?: string;
}

export interface GoalMilestone {
  id: string;
  /** Id of the goal this milestone belongs to. */
  goalId: string;
  /** Percentage threshold: 10, 25, 50, 75, 90, or 100. */
  pct: number;
  /** ISO date when the milestone was first reached. */
  reachedAt: string;
  /** Whether a notification has already been shown for this milestone. */
  notified: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string;
  icon: string;
  /** ISO date when the goal was created. */
  lastContributionDate?: string; // ISO date of the most recent contribution
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string;
  lender: string;
  balance: number;
  originalAmount: number;
  interestRate: number;
  minPayment: number;
  dueDate: string;
}

export type AccountType = "bank" | "credit_card" | "mobile_wallet" | "cash" | "investment";

export interface Account {
  id: string;
  name: string;
  bank: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  openingBalance: number;
  notes?: string;
}
