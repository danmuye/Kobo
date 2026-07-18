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
  tags?: string[];
  merchant?: string;
  budgetId?: string | null;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  period: "Monthly" | "Weekly" | "Yearly" | "Custom";
  startDate?: string;
  endDate?: string;
  categories: string[];
  accounts?: string[];
  wallets?: string[];
  tags?: string[];
  color: string;
  icon: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type FundingType = "Income" | "Savings Transfer" | "Manual Deposit" | "Mixed";
export type GoalPriority = "low" | "medium" | "high";

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  startDate: string;
  fundingType: FundingType;
  categories: string[];
  accounts: string[];
  wallets: string[];
  tags: string[];
  color: string;
  icon: string;
  priority: GoalPriority;
  notes: string;
  autoTrack: boolean;
  includeTransfers: boolean;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}
