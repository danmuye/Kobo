import type {
  Transaction,
  Budget,
  Goal,
  Debt,
  Account,
  BudgetHistoryEntry,
} from "@/types";

let _counter = 0;
function seq(prefix = ""): string {
  _counter++;
  return `${prefix}${_counter}`;
}

export function buildTransaction(overrides: Partial<Transaction> = {}): Transaction {
  const id = seq("tx-");
  return {
    id,
    date: new Date().toISOString(),
    description: `Transaction ${id}`,
    category: "Food",
    account: "Main Account",
    amount: 1000,
    type: "expense",
    notes: "",
    tags: [],
    ...overrides,
  };
}

export function buildBudget(overrides: Partial<Budget> = {}): Budget {
  const id = seq("budget-");
  return {
    id,
    name: `Budget ${id}`,
    amount: 50000,
    period: "Monthly",
    categories: ["Food"],
    color: "#3b82f6",
    icon: "shopping-cart",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildGoal(overrides: Partial<Goal> = {}): Goal {
  const id = seq("goal-");
  return {
    id,
    name: `Goal ${id}`,
    targetAmount: 100000,
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    startDate: new Date().toISOString(),
    fundingType: "Mixed",
    categories: [],
    accounts: [],
    wallets: [],
    tags: [],
    color: "#8b5cf6",
    icon: "target",
    priority: "medium",
    notes: "",
    autoTrack: true,
    includeTransfers: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildDebt(overrides: Partial<Debt> = {}): Debt {
  const id = seq("debt-");
  return {
    id,
    name: `Debt ${id}`,
    lender: "Bank",
    originalAmount: 500000,
    interestRate: 10,
    debtType: "Loan",
    repaymentType: "Fixed",
    minimumPayment: 10000,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    categories: [],
    accounts: [],
    wallets: [],
    tags: [],
    color: "#ef4444",
    icon: "credit-card",
    notes: "",
    includeTransfers: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildAccount(overrides: Partial<Account> = {}): Account {
  const id = seq("acct-");
  return {
    id,
    name: `Account ${id}`,
    bank: "Test Bank",
    type: "bank",
    balance: 0,
    currency: "NGN",
    color: "#3b82f6",
    icon: "wallet",
    openingBalance: 0,
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildBudgetHistory(overrides: Partial<BudgetHistoryEntry> = {}): BudgetHistoryEntry {
  const id = seq("bhist-");
  return {
    id,
    budgetId: "budget-0",
    budgetName: "Test Budget",
    period: "Monthly",
    amount: 50000,
    spent: 30000,
    remaining: 20000,
    percentage: 60,
    transactionCount: 5,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    archivedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function resetCounter(): void {
  _counter = 0;
}
