import type {
  Transaction, Budget, SavingsGoal, GoalContributionEntry,
  GoalMilestone, Debt, Account,
} from "@/types";

export interface ITransactionService {
  list(): Transaction[];
  getById(id: string): Transaction | undefined;
  create(data: Omit<Transaction, "id">): Transaction;
  update(id: string, data: Partial<Transaction>): Transaction | undefined;
  delete(id: string): void;
}

export interface IBudgetService {
  list(): Budget[];
  getById(id: string): Budget | undefined;
  create(data: Omit<Budget, "id">): Budget;
  update(id: string, data: Partial<Budget>): Budget | undefined;
  delete(id: string): void;
  archive(id: string): void;
}

export interface IGoalService {
  list(): SavingsGoal[];
  getById(id: string): SavingsGoal | undefined;
  create(data: Omit<SavingsGoal, "id">): SavingsGoal;
  update(id: string, data: Partial<SavingsGoal>): SavingsGoal | undefined;
  delete(id: string): void;
}

export interface IGoalContributionService {
  list(): GoalContributionEntry[];
  create(data: Omit<GoalContributionEntry, "id">): GoalContributionEntry;
  update(id: string, data: Partial<GoalContributionEntry>): GoalContributionEntry | undefined;
  delete(id: string): void;
}

export interface IDebtService {
  list(): Debt[];
  getById(id: string): Debt | undefined;
  create(data: Omit<Debt, "id">): Debt;
  update(id: string, data: Partial<Debt>): Debt | undefined;
  delete(id: string): void;
}

export interface IAccountService {
  list(): Account[];
  getById(id: string): Account | undefined;
  create(data: Omit<Account, "id">): Account;
  update(id: string, data: Partial<Account>): Account | undefined;
  delete(id: string): void;
}

export interface IFinanceService {
  transactions: ITransactionService;
  budgets: IBudgetService;
  goals: IGoalService;
  goalContributions: IGoalContributionService;
  debts: IDebtService;
  accounts: IAccountService;
  resetDemoData(): void;
  clearAllData(): void;
  restoreData(data: {
    transactions: Transaction[];
    budgets: Budget[];
    goals: SavingsGoal[];
    goalContributions: GoalContributionEntry[];
    goalMilestones: GoalMilestone[];
    debts: Debt[];
    accounts: Account[];
  }): void;
}
