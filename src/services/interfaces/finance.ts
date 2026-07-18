import type {
  Transaction, Budget, Goal, Debt, Account,
} from "@/types";
import type { GoalHistoryEntry } from "@/services/goal-insights";

export interface ITransactionService {
  list(): Transaction[];
  getById(id: string): Transaction | undefined;
  create(data: Omit<Transaction, "id">): Promise<Transaction>;
  update(id: string, data: Partial<Transaction>): Promise<Transaction | undefined>;
  delete(id: string): Promise<void>;
}

export interface IBudgetService {
  list(): Budget[];
  getById(id: string): Budget | undefined;
  create(data: Omit<Budget, "id">): Promise<Budget>;
  update(id: string, data: Partial<Budget>): Promise<Budget | undefined>;
  delete(id: string): Promise<void>;
}

export interface IGoalService {
  list(): Goal[];
  getById(id: string): Goal | undefined;
  create(data: Omit<Goal, "id">): Promise<Goal>;
  update(id: string, data: Partial<Goal>): Promise<Goal | undefined>;
  delete(id: string): Promise<void>;
}

export interface IDebtService {
  list(): Debt[];
  getById(id: string): Debt | undefined;
  create(data: Omit<Debt, "id">): Promise<Debt>;
  update(id: string, data: Partial<Debt>): Promise<Debt | undefined>;
  delete(id: string): Promise<void>;
}

export interface IAccountService {
  list(): Account[];
  getById(id: string): Account | undefined;
  create(data: Omit<Account, "id">): Promise<Account>;
  update(id: string, data: Partial<Account>): Promise<Account | undefined>;
  delete(id: string): Promise<void>;
}

export interface IFinanceService {
  transactions: ITransactionService;
  budgets: IBudgetService;
  goals: IGoalService;
  debts: IDebtService;
  accounts: IAccountService;
  clearAllData(): Promise<void>;
  restoreData(data: {
    transactions: Transaction[];
    budgets: Budget[];
    budgetHistory?: BudgetHistoryEntry[];
    goals: Goal[];
    goalHistory?: GoalHistoryEntry[];
    debts: Debt[];
    accounts: Account[];
  }): Promise<void>;
}
