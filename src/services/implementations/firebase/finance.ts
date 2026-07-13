import type {
  Transaction, Budget, SavingsGoal, GoalContributionEntry,
  GoalMilestone, Debt, Account,
} from "@/types";
import type {
  IFinanceService, ITransactionService, IBudgetService,
  IGoalService, IGoalContributionService, IDebtService, IAccountService,
} from "@/services/interfaces";
import { createCollection, type FirestoreCollection } from "@/services/firebase/firestore";

class FirebaseTransactionService implements ITransactionService {
  private colPromise: Promise<FirestoreCollection<Transaction>>;

  constructor(userId: string) {
    this.colPromise = createCollection<Transaction>(`users/${userId}/transactions`);
  }

  list(): Transaction[] { throw new Error("Use listAsync() for Firebase"); }
  getById(): Transaction | undefined { throw new Error("Use getByIdAsync() for Firebase"); }
  create(): Transaction { throw new Error("Use createAsync() for Firebase"); }
  update(): Transaction | undefined { throw new Error("Use updateAsync() for Firebase"); }
  delete(): void { throw new Error("Use deleteAsync() for Firebase"); }

  async listAsync(): Promise<Transaction[]> { return (await this.colPromise).getAll(); }
  async getByIdAsync(id: string): Promise<Transaction | null> { return (await this.colPromise).getById(id); }
  async createAsync(data: Omit<Transaction, "id">): Promise<Transaction> { return (await this.colPromise).create(data); }
  async updateAsync(id: string, data: Partial<Transaction>): Promise<void> { await (await this.colPromise).update(id, data); }
  async deleteAsync(id: string): Promise<void> { await (await this.colPromise).delete(id); }
}

class FirebaseBudgetService implements IBudgetService {
  private colPromise: Promise<FirestoreCollection<Budget>>;
  constructor(userId: string) { this.colPromise = createCollection<Budget>(`users/${userId}/budgets`); }
  list(): Budget[] { throw new Error("Async only"); }
  getById(): Budget | undefined { throw new Error("Async only"); }
  create(): Budget { throw new Error("Async only"); }
  update(): Budget | undefined { throw new Error("Async only"); }
  delete(): void { throw new Error("Async only"); }
  async listAsync(): Promise<Budget[]> { return (await this.colPromise).getAll(); }
  async getByIdAsync(id: string): Promise<Budget | null> { return (await this.colPromise).getById(id); }
  async createAsync(data: Omit<Budget, "id">): Promise<Budget> { return (await this.colPromise).create(data); }
  async updateAsync(id: string, data: Partial<Budget>): Promise<void> { await (await this.colPromise).update(id, data); }
  async deleteAsync(id: string): Promise<void> { await (await this.colPromise).delete(id); }
  async archiveAsync(): Promise<void> { /* implement archive */ }
}

class FirebaseGoalService implements IGoalService {
  private colPromise: Promise<FirestoreCollection<SavingsGoal>>;
  constructor(userId: string) { this.colPromise = createCollection<SavingsGoal>(`users/${userId}/goals`); }
  list(): SavingsGoal[] { throw new Error("Async only"); }
  getById(): SavingsGoal | undefined { throw new Error("Async only"); }
  create(): SavingsGoal { throw new Error("Async only"); }
  update(): SavingsGoal | undefined { throw new Error("Async only"); }
  delete(): void { throw new Error("Async only"); }
  async listAsync(): Promise<SavingsGoal[]> { return (await this.colPromise).getAll(); }
  async getByIdAsync(id: string): Promise<SavingsGoal | null> { return (await this.colPromise).getById(id); }
  async createAsync(data: Omit<SavingsGoal, "id">): Promise<SavingsGoal> { return (await this.colPromise).create(data); }
  async updateAsync(id: string, data: Partial<SavingsGoal>): Promise<void> { await (await this.colPromise).update(id, data); }
  async deleteAsync(id: string): Promise<void> { await (await this.colPromise).delete(id); }
}

class FirebaseGoalContributionService implements IGoalContributionService {
  private colPromise: Promise<FirestoreCollection<GoalContributionEntry>>;
  constructor(userId: string) { this.colPromise = createCollection<GoalContributionEntry>(`users/${userId}/goalContributions`); }
  list(): GoalContributionEntry[] { throw new Error("Async only"); }
  create(): GoalContributionEntry { throw new Error("Async only"); }
  update(): GoalContributionEntry | undefined { throw new Error("Async only"); }
  delete(): void { throw new Error("Async only"); }
  async listAsync(): Promise<GoalContributionEntry[]> { return (await this.colPromise).getAll(); }
  async createAsync(data: Omit<GoalContributionEntry, "id">): Promise<GoalContributionEntry> { return (await this.colPromise).create(data); }
  async updateAsync(id: string, data: Partial<GoalContributionEntry>): Promise<void> { await (await this.colPromise).update(id, data); }
  async deleteAsync(id: string): Promise<void> { await (await this.colPromise).delete(id); }
}

class FirebaseDebtService implements IDebtService {
  private colPromise: Promise<FirestoreCollection<Debt>>;
  constructor(userId: string) { this.colPromise = createCollection<Debt>(`users/${userId}/debts`); }
  list(): Debt[] { throw new Error("Async only"); }
  getById(): Debt | undefined { throw new Error("Async only"); }
  create(): Debt { throw new Error("Async only"); }
  update(): Debt | undefined { throw new Error("Async only"); }
  delete(): void { throw new Error("Async only"); }
  async listAsync(): Promise<Debt[]> { return (await this.colPromise).getAll(); }
  async getByIdAsync(id: string): Promise<Debt | null> { return (await this.colPromise).getById(id); }
  async createAsync(data: Omit<Debt, "id">): Promise<Debt> { return (await this.colPromise).create(data); }
  async updateAsync(id: string, data: Partial<Debt>): Promise<void> { await (await this.colPromise).update(id, data); }
  async deleteAsync(id: string): Promise<void> { await (await this.colPromise).delete(id); }
}

class FirebaseAccountService implements IAccountService {
  private colPromise: Promise<FirestoreCollection<Account>>;
  constructor(userId: string) { this.colPromise = createCollection<Account>(`users/${userId}/accounts`); }
  list(): Account[] { throw new Error("Async only"); }
  getById(): Account | undefined { throw new Error("Async only"); }
  create(): Account { throw new Error("Async only"); }
  update(): Account | undefined { throw new Error("Async only"); }
  delete(): void { throw new Error("Async only"); }
  async listAsync(): Promise<Account[]> { return (await this.colPromise).getAll(); }
  async getByIdAsync(id: string): Promise<Account | null> { return (await this.colPromise).getById(id); }
  async createAsync(data: Omit<Account, "id">): Promise<Account> { return (await this.colPromise).create(data); }
  async updateAsync(id: string, data: Partial<Account>): Promise<void> { await (await this.colPromise).update(id, data); }
  async deleteAsync(id: string): Promise<void> { await (await this.colPromise).delete(id); }
}

export class FirebaseFinanceService implements IFinanceService {
  transactions: FirebaseTransactionService;
  budgets: FirebaseBudgetService;
  goals: FirebaseGoalService;
  goalContributions: FirebaseGoalContributionService;
  debts: FirebaseDebtService;
  accounts: FirebaseAccountService;

  constructor(userId: string) {
    this.transactions = new FirebaseTransactionService(userId);
    this.budgets = new FirebaseBudgetService(userId);
    this.goals = new FirebaseGoalService(userId);
    this.goalContributions = new FirebaseGoalContributionService(userId);
    this.debts = new FirebaseDebtService(userId);
    this.accounts = new FirebaseAccountService(userId);
  }

  resetDemoData(): void { /* no-op for Firebase */ }
  clearAllData(): void { /* no-op for Firebase */ }
  restoreData(): void { /* no-op for Firebase */ }
}
