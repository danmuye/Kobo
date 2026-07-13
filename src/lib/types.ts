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

export interface Budget {
  id: string;
  name: string;
  category: string;
  icon: string; // icon key
  amount: number;
  spent: number;
  period: "monthly" | "weekly" | "yearly";
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string;
  icon: string;
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
