import type {
  Transaction, Budget, BudgetHistoryEntry, Goal, Debt, Account,
} from "@/types";
import type { GoalHistoryEntry } from "@/services/goal-insights";
import type {
  IFinanceService, ITransactionService, IBudgetService,
  IGoalService, IDebtService, IAccountService,
} from "@/services/interfaces";
import { useFinanceStore } from "@/store/finance";
import { createCollection, type FirestoreCollection } from "@/services/firebase/firestore";

class FirebaseTransactionService implements ITransactionService {
  private colPromise: Promise<FirestoreCollection<Transaction>>;

  constructor(userId: string) {
    this.colPromise = createCollection<Transaction>(`users/${userId}/transactions`);
  }

  list(): Transaction[] {
    return useFinanceStore.getState().transactions;
  }

  getById(id: string): Transaction | undefined {
    return useFinanceStore.getState().transactions.find((t) => t.id === id);
  }

  async create(data: Omit<Transaction, "id">): Promise<Transaction> {
    const col = await this.colPromise;
    const result = await col.create(data);
    useFinanceStore.getState().addTransaction(result);
    return result;
  }

  async update(id: string, data: Partial<Transaction>): Promise<Transaction | undefined> {
    const old = this.getById(id);
    if (!old) return undefined;
    const merged: Transaction = { ...old, ...data };
    const col = await this.colPromise;
    await col.update(id, merged);
    useFinanceStore.getState().updateTransaction(id, data);
    return merged;
  }

  async delete(id: string): Promise<void> {
    const col = await this.colPromise;
    await col.delete(id);
    useFinanceStore.getState().deleteTransaction(id);
  }
}

class FirebaseBudgetService implements IBudgetService {
  private colPromise: Promise<FirestoreCollection<Budget>>;

  constructor(userId: string) {
    this.colPromise = createCollection<Budget>(`users/${userId}/budgets`);
  }

  list(): Budget[] {
    return useFinanceStore.getState().budgets;
  }

  getById(id: string): Budget | undefined {
    return useFinanceStore.getState().budgets.find((b) => b.id === id);
  }

  async create(data: Omit<Budget, "id">): Promise<Budget> {
    const col = await this.colPromise;
    const result = await col.create(data);
    useFinanceStore.getState().addBudget(result);
    return result;
  }

  async update(id: string, data: Partial<Budget>): Promise<Budget | undefined> {
    const old = this.getById(id);
    if (!old) return undefined;
    const merged: Budget = { ...old, ...data };
    const col = await this.colPromise;
    await col.update(id, merged);
    useFinanceStore.getState().updateBudget(id, data);
    return merged;
  }

  async delete(id: string): Promise<void> {
    const col = await this.colPromise;
    await col.delete(id);
    useFinanceStore.getState().deleteBudget(id);
  }

}

class FirebaseGoalService implements IGoalService {
  private colPromise: Promise<FirestoreCollection<Goal>>;

  constructor(userId: string) {
    this.colPromise = createCollection<Goal>(`users/${userId}/goals`);
  }

  list(): Goal[] {
    return useFinanceStore.getState().goals;
  }

  getById(id: string): Goal | undefined {
    return useFinanceStore.getState().goals.find((g) => g.id === id);
  }

  async create(data: Omit<Goal, "id">): Promise<Goal> {
    const col = await this.colPromise;
    const result = await col.create(data);
    useFinanceStore.getState().addGoal(result);
    return result;
  }

  async update(id: string, data: Partial<Goal>): Promise<Goal | undefined> {
    const old = this.getById(id);
    if (!old) return undefined;
    const merged: Goal = { ...old, ...data };
    const col = await this.colPromise;
    await col.update(id, merged);
    useFinanceStore.getState().updateGoal(id, data);
    return merged;
  }

  async delete(id: string): Promise<void> {
    const col = await this.colPromise;
    await col.delete(id);
    useFinanceStore.getState().deleteGoal(id);
  }
}

class FirebaseDebtService implements IDebtService {
  private colPromise: Promise<FirestoreCollection<Debt>>;

  constructor(userId: string) {
    this.colPromise = createCollection<Debt>(`users/${userId}/debts`);
  }

  list(): Debt[] {
    return useFinanceStore.getState().debts;
  }

  getById(id: string): Debt | undefined {
    return useFinanceStore.getState().debts.find((d) => d.id === id);
  }

  async create(data: Omit<Debt, "id">): Promise<Debt> {
    const col = await this.colPromise;
    const result = await col.create(data);
    useFinanceStore.getState().addDebt(result);
    return result;
  }

  async update(id: string, data: Partial<Debt>): Promise<Debt | undefined> {
    const old = this.getById(id);
    if (!old) return undefined;
    const merged: Debt = { ...old, ...data };
    const col = await this.colPromise;
    await col.update(id, merged);
    useFinanceStore.getState().updateDebt(id, data);
    return merged;
  }

  async delete(id: string): Promise<void> {
    const col = await this.colPromise;
    await col.delete(id);
    useFinanceStore.getState().deleteDebt(id);
  }
}

class FirebaseAccountService implements IAccountService {
  private colPromise: Promise<FirestoreCollection<Account>>;

  constructor(userId: string) {
    this.colPromise = createCollection<Account>(`users/${userId}/accounts`);
  }

  list(): Account[] {
    return useFinanceStore.getState().accounts;
  }

  getById(id: string): Account | undefined {
    return useFinanceStore.getState().accounts.find((a) => a.id === id);
  }

  async create(data: Omit<Account, "id">): Promise<Account> {
    const col = await this.colPromise;
    const result = await col.create(data);
    useFinanceStore.getState().addAccount(result);
    return result;
  }

  async update(id: string, data: Partial<Account>): Promise<Account | undefined> {
    const old = this.getById(id);
    if (!old) return undefined;
    const merged: Account = { ...old, ...data };
    const col = await this.colPromise;
    await col.update(id, merged);
    useFinanceStore.getState().updateAccount(id, data);
    return merged;
  }

  async delete(id: string): Promise<void> {
    const col = await this.colPromise;
    await col.delete(id);
    useFinanceStore.getState().deleteAccount(id);
  }
}

export class FirebaseFinanceService implements IFinanceService {
  transactions: FirebaseTransactionService;
  budgets: FirebaseBudgetService;
  goals: FirebaseGoalService;
  debts: FirebaseDebtService;
  accounts: FirebaseAccountService;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.transactions = new FirebaseTransactionService(userId);
    this.budgets = new FirebaseBudgetService(userId);
    this.goals = new FirebaseGoalService(userId);
    this.debts = new FirebaseDebtService(userId);
    this.accounts = new FirebaseAccountService(userId);
  }

  async init(): Promise<void> {
    const uid = this.userId;
    const [transactions, budgets, goals, debts, accounts, goalHistory] = await Promise.all([
      createCollection<Transaction>(`users/${uid}/transactions`).then((c) => c.getAll()),
      createCollection<Budget>(`users/${uid}/budgets`).then((c) => c.getAll()),
      createCollection<Goal>(`users/${uid}/goals`).then((c) => c.getAll()),
      createCollection<Debt>(`users/${uid}/debts`).then((c) => c.getAll()),
      createCollection<Account>(`users/${uid}/accounts`).then((c) => c.getAll()),
      createCollection<GoalHistoryEntry>(`users/${uid}/goalHistory`).then((c) => c.getAll()),
    ]);
    useFinanceStore.getState().restoreData({
      transactions,
      budgets,
      budgetHistory: [],
      goals,
      goalHistory,
      debts,
      accounts,
    });
  }

  async clearAllData(): Promise<void> {
    useFinanceStore.getState().clearAllData();
    const uid = this.userId;
    const colTasks = await Promise.all([
      createCollection<Transaction>(`users/${uid}/transactions`),
      createCollection<Budget>(`users/${uid}/budgets`),
      createCollection<Goal>(`users/${uid}/goals`),
      createCollection<GoalHistoryEntry>(`users/${uid}/goalHistory`),
      createCollection<Debt>(`users/${uid}/debts`),
      createCollection<Account>(`users/${uid}/accounts`),
    ]);
    const deleteTasks = colTasks.map((col) =>
      col.getAll().then((items) => Promise.all(items.map((i) => col.delete(i.id)))),
    );
    await Promise.allSettled(deleteTasks);
  }

  async restoreData(data: {
    transactions: Transaction[];
    budgets: Budget[];
    budgetHistory?: BudgetHistoryEntry[];
    goals: Goal[];
    goalHistory?: GoalHistoryEntry[];
    debts: Debt[];
    accounts: Account[];
  }): Promise<void> {
    useFinanceStore.getState().restoreData(data);
  }
}
