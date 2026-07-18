import type {
  Transaction, Budget, BudgetHistoryEntry, Goal, Debt, Account,
} from "@/types";
import type { GoalHistoryEntry } from "@/services/goal-insights";
import type {
  IFinanceService, ITransactionService, IBudgetService,
  IGoalService, IDebtService, IAccountService,
} from "@/services/interfaces";
import { useFinanceStore } from "@/store/finance";

const STORAGE_KEY = "kobo-finance-store-v1";

function persistFinanceState(): void {
  const state = useFinanceStore.getState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    transactions: state.transactions ?? [],
    budgets: state.budgets ?? [],
    budgetHistory: state.budgetHistory ?? [],
    goals: state.goals ?? [],
    goalHistory: state.goalHistory ?? [],
    debts: state.debts ?? [],
    accounts: state.accounts ?? [],
  }));
}

function loadFinanceState(): {
  transactions: Transaction[]; budgets: Budget[]; budgetHistory: BudgetHistoryEntry[]; goals: Goal[];
  goalHistory: GoalHistoryEntry[]; debts: Debt[]; accounts: Account[];
} | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const data = parsed as Record<string, unknown>;
  return {
    transactions: Array.isArray(data.transactions) ? (data.transactions as Transaction[]) : [],
    budgets: Array.isArray(data.budgets) ? (data.budgets as Budget[]) : [],
    budgetHistory: Array.isArray(data.budgetHistory) ? (data.budgetHistory as BudgetHistoryEntry[]) : [],
    goals: Array.isArray(data.goals) ? (data.goals as Goal[]) : [],
    goalHistory: Array.isArray(data.goalHistory) ? (data.goalHistory as GoalHistoryEntry[]) : [],
    debts: Array.isArray(data.debts) ? (data.debts as Debt[]) : [],
    accounts: Array.isArray(data.accounts) ? (data.accounts as Account[]) : [],
  };
}

const id = () => Math.random().toString(36).slice(2, 10);

class LocalTransactionService implements ITransactionService {
  list(): Transaction[] {
    return useFinanceStore.getState().transactions;
  }
  getById(id: string): Transaction | undefined {
    return useFinanceStore.getState().transactions.find((t) => t.id === id);
  }
  async create(data: Omit<Transaction, "id">): Promise<Transaction> {
    const tx: Transaction = { ...data, id: id() };
    useFinanceStore.getState().addTransaction(tx);
    return tx;
  }
  async update(id: string, data: Partial<Transaction>): Promise<Transaction | undefined> {
    useFinanceStore.getState().updateTransaction(id, data);
    return this.getById(id);
  }
  async delete(id: string): Promise<void> {
    useFinanceStore.getState().deleteTransaction(id);
  }
}

class LocalBudgetService implements IBudgetService {
  list(): Budget[] {
    return useFinanceStore.getState().budgets;
  }
  getById(id: string): Budget | undefined {
    return useFinanceStore.getState().budgets.find((b) => b.id === id);
  }
  async create(data: Omit<Budget, "id">): Promise<Budget> {
    const budget: Budget = { ...data, id: id() };
    useFinanceStore.getState().addBudget(budget);
    return budget;
  }
  async update(id: string, data: Partial<Budget>): Promise<Budget | undefined> {
    useFinanceStore.getState().updateBudget(id, data);
    return this.getById(id);
  }
  async delete(id: string): Promise<void> {
    useFinanceStore.getState().deleteBudget(id);
  }
}

class LocalGoalService implements IGoalService {
  list(): Goal[] {
    return useFinanceStore.getState().goals;
  }
  getById(id: string): Goal | undefined {
    return useFinanceStore.getState().goals.find((g) => g.id === id);
  }
  async create(data: Omit<Goal, "id">): Promise<Goal> {
    const goal: Goal = { ...data, id: id() };
    useFinanceStore.getState().addGoal(goal);
    return goal;
  }
  async update(id: string, data: Partial<Goal>): Promise<Goal | undefined> {
    useFinanceStore.getState().updateGoal(id, data);
    return this.getById(id);
  }
  async delete(id: string): Promise<void> {
    useFinanceStore.getState().deleteGoal(id);
  }
}

class LocalDebtService implements IDebtService {
  list(): Debt[] {
    return useFinanceStore.getState().debts;
  }
  getById(id: string): Debt | undefined {
    return useFinanceStore.getState().debts.find((d) => d.id === id);
  }
  async create(data: Omit<Debt, "id">): Promise<Debt> {
    const debt: Debt = { ...data, id: id() };
    useFinanceStore.getState().addDebt(debt);
    return debt;
  }
  async update(id: string, data: Partial<Debt>): Promise<Debt | undefined> {
    useFinanceStore.getState().updateDebt(id, data);
    return this.getById(id);
  }
  async delete(id: string): Promise<void> {
    useFinanceStore.getState().deleteDebt(id);
  }
}

class LocalAccountService implements IAccountService {
  list(): Account[] {
    return useFinanceStore.getState().accounts;
  }
  getById(id: string): Account | undefined {
    return useFinanceStore.getState().accounts.find((a) => a.id === id);
  }
  async create(data: Omit<Account, "id">): Promise<Account> {
    const account: Account = { ...data, id: id() };
    useFinanceStore.getState().addAccount(account);
    return account;
  }
  async update(id: string, data: Partial<Account>): Promise<Account | undefined> {
    useFinanceStore.getState().updateAccount(id, data);
    return this.getById(id);
  }
  async delete(id: string): Promise<void> {
    useFinanceStore.getState().deleteAccount(id);
  }
}

export class LocalFinanceService implements IFinanceService {
  private unsub: (() => void) | null = null;

  transactions = new LocalTransactionService();
  budgets = new LocalBudgetService();
  goals = new LocalGoalService();
  debts = new LocalDebtService();
  accounts = new LocalAccountService();

  init(): void {
    const saved = loadFinanceState();
    if (saved) {
      useFinanceStore.getState().restoreData(saved);
    }
    this.unsub = useFinanceStore.subscribe(() => {
      persistFinanceState();
    });
  }

  destroy(): void {
    this.unsub?.();
  }

  async clearAllData(): Promise<void> {
    useFinanceStore.getState().clearAllData();
  }
  async restoreData(data: {
    transactions: Transaction[]; budgets: Budget[]; budgetHistory?: BudgetHistoryEntry[]; goals: Goal[];
    goalHistory?: GoalHistoryEntry[]; debts: Debt[]; accounts: Account[];
  }): Promise<void> {
    useFinanceStore.getState().restoreData(data);
  }
}
