import type {
  Transaction, Budget, SavingsGoal, GoalContributionEntry,
  GoalMilestone, Debt, Account,
} from "@/types";
import type {
  IFinanceService, ITransactionService, IBudgetService,
  IGoalService, IGoalContributionService, IDebtService, IAccountService,
} from "@/services/interfaces";
import { useFinanceStore } from "@/store/finance";

const STORAGE_KEY = "kobo-finance-store-v1";

function persistFinanceState(): void {
  const state = useFinanceStore.getState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    transactions: state.transactions ?? [],
    budgets: state.budgets ?? [],
    goals: state.goals ?? [],
    goalContributions: state.goalContributions ?? [],
    goalMilestones: state.goalMilestones ?? [],
    debts: state.debts ?? [],
    accounts: state.accounts ?? [],
  }));
}

function loadFinanceState(): {
  transactions: Transaction[]; budgets: Budget[]; goals: SavingsGoal[];
  goalContributions: GoalContributionEntry[]; goalMilestones: GoalMilestone[];
  debts: Debt[]; accounts: Account[];
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
    goals: Array.isArray(data.goals) ? (data.goals as SavingsGoal[]) : [],
    goalContributions: Array.isArray(data.goalContributions) ? (data.goalContributions as GoalContributionEntry[]) : [],
    goalMilestones: Array.isArray(data.goalMilestones) ? (data.goalMilestones as GoalMilestone[]) : [],
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
  create(data: Omit<Transaction, "id">): Transaction {
    const tx: Transaction = { ...data, id: id() };
    useFinanceStore.getState().addTransaction(data);
    return tx;
  }
  update(id: string, data: Partial<Transaction>): Transaction | undefined {
    useFinanceStore.getState().updateTransaction(id, data);
    return this.getById(id);
  }
  delete(id: string): void {
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
  create(data: Omit<Budget, "id">): Budget {
    const budget: Budget = { ...data, id: id() };
    useFinanceStore.getState().addBudget(data);
    return budget;
  }
  update(id: string, data: Partial<Budget>): Budget | undefined {
    useFinanceStore.getState().updateBudget(id, data);
    return this.getById(id);
  }
  delete(id: string): void {
    useFinanceStore.getState().deleteBudget(id);
  }
  archive(id: string): void {
    useFinanceStore.getState().archiveBudget(id);
  }
}

class LocalGoalService implements IGoalService {
  list(): SavingsGoal[] {
    return useFinanceStore.getState().goals;
  }
  getById(id: string): SavingsGoal | undefined {
    return useFinanceStore.getState().goals.find((g) => g.id === id);
  }
  create(data: Omit<SavingsGoal, "id">): SavingsGoal {
    useFinanceStore.getState().addGoal(data);
    return this.list()[this.list().length - 1];
  }
  update(id: string, data: Partial<SavingsGoal>): SavingsGoal | undefined {
    useFinanceStore.getState().updateGoal(id, data);
    return this.getById(id);
  }
  delete(id: string): void {
    useFinanceStore.getState().deleteGoal(id);
  }
}

class LocalGoalContributionService implements IGoalContributionService {
  list(): GoalContributionEntry[] {
    return useFinanceStore.getState().goalContributions;
  }
  create(data: Omit<GoalContributionEntry, "id">): GoalContributionEntry {
    useFinanceStore.getState().addGoalContribution(data);
    return this.list()[this.list().length - 1];
  }
  update(id: string, data: Partial<GoalContributionEntry>): GoalContributionEntry | undefined {
    useFinanceStore.getState().updateGoalContribution(id, data);
    return this.list().find((c) => c.id === id);
  }
  delete(id: string): void {
    useFinanceStore.getState().deleteGoalContribution(id);
  }
}

class LocalDebtService implements IDebtService {
  list(): Debt[] {
    return useFinanceStore.getState().debts;
  }
  getById(id: string): Debt | undefined {
    return useFinanceStore.getState().debts.find((d) => d.id === id);
  }
  create(data: Omit<Debt, "id">): Debt {
    const debt: Debt = { ...data, id: id() };
    useFinanceStore.getState().addDebt(data);
    return debt;
  }
  update(id: string, data: Partial<Debt>): Debt | undefined {
    useFinanceStore.getState().updateDebt(id, data);
    return this.getById(id);
  }
  delete(id: string): void {
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
  create(data: Omit<Account, "id">): Account {
    const account: Account = { ...data, id: id() };
    useFinanceStore.getState().addAccount(data);
    return account;
  }
  update(id: string, data: Partial<Account>): Account | undefined {
    useFinanceStore.getState().updateAccount(id, data);
    return this.getById(id);
  }
  delete(id: string): void {
    useFinanceStore.getState().deleteAccount(id);
  }
}

export class LocalFinanceService implements IFinanceService {
  private unsub: (() => void) | null = null;

  transactions = new LocalTransactionService();
  budgets = new LocalBudgetService();
  goals = new LocalGoalService();
  goalContributions = new LocalGoalContributionService();
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

  resetDemoData(): void {
    useFinanceStore.getState().resetDemoData();
  }
  clearAllData(): void {
    useFinanceStore.getState().clearAllData();
  }
  restoreData(data: {
    transactions: Transaction[]; budgets: Budget[]; goals: SavingsGoal[];
    goalContributions: GoalContributionEntry[]; goalMilestones: GoalMilestone[];
    debts: Debt[]; accounts: Account[];
  }): void {
    useFinanceStore.getState().restoreData(data);
  }
}
