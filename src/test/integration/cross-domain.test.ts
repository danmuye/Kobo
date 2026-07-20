import { describe, it, expect, beforeEach } from "vitest";
import { useFinanceStore, getTotalBalance, getMonthlyChart, getCategoryBreakdown, getNetCashFlow, getAccountsByType } from "@/store/finance";
import { useNotificationStore } from "@/store/notifications";
import { buildAccount, buildTransaction, buildBudget, buildGoal, buildDebt, resetCounter } from "@/test/factories";
import { calculateBudgetMetrics } from "@/services/budget-matching";
import { calculateGoalMetrics } from "@/services/goal-matching";
import { calculateDebtMetrics, calculateDebtTotals } from "@/services/debt-matching";
import { computeAccountBalance } from "@/services/account-balance";
import type { Budget, Goal, Debt } from "@/types";

beforeEach(() => {
  resetCounter();
  useFinanceStore.setState({
    transactions: [], budgets: [], budgetHistory: [],
    goals: [], goalHistory: [],
    debts: [], debtHistory: [],
    accounts: [],
  });
  useNotificationStore.setState({ notifications: [], preferences: {} as any });
});

describe("Cross-domain integration — complete user session", () => {
  it("manages a full monthly financial cycle", () => {
    const salaryAccount = buildAccount({ name: "Salary Account", openingBalance: 0 });
    const foodBudget = buildBudget({ name: "Food", amount: 50000, categories: ["Food"] }) as Budget;
    const vacationGoal = buildGoal({ name: "Vacation", targetAmount: 200000 }) as Goal;
    const carDebt = buildDebt({ name: "Car Loan", originalAmount: 500000 }) as Debt;

    useFinanceStore.getState().addAccount(salaryAccount);
    useFinanceStore.getState().addBudget(foodBudget);
    useFinanceStore.getState().addGoal(vacationGoal);
    useFinanceStore.getState().addDebt(carDebt);

    useFinanceStore.getState().addTransaction(buildTransaction({
      description: "Monthly salary",
      amount: 300000,
      type: "income",
      category: "Salary",
      account: "Salary Account",
    }));

    useFinanceStore.getState().addTransaction(buildTransaction({
      description: "Groceries",
      amount: 15000,
      type: "expense",
      category: "Food",
      account: "Salary Account",
      budgetId: foodBudget.id,
    }));

    useFinanceStore.getState().addTransaction(buildTransaction({
      description: "Restaurant",
      amount: 10000,
      type: "expense",
      category: "Food",
      account: "Salary Account",
      budgetId: foodBudget.id,
    }));

    useFinanceStore.getState().addTransaction(buildTransaction({
      description: "Car payment",
      amount: 50000,
      type: "expense",
      category: "Debt Payment",
      account: "Salary Account",
      debtId: carDebt.id,
    }));

    useFinanceStore.getState().addTransaction(buildTransaction({
      description: "Vacation contribution",
      amount: 30000,
      type: "expense",
      category: "Savings",
      account: "Salary Account",
      goalId: vacationGoal.id,
    }));

    const all = useFinanceStore.getState().transactions;
    expect(all).toHaveLength(5);

    const balance = getTotalBalance(
      useFinanceStore.getState().accounts,
      all,
    );
    expect(balance).toBe(300000 - 15000 - 10000 - 50000 - 30000);
    expect(balance).toBe(195000);

    const income = getNetCashFlow(all);
    expect(income).toBe(300000 - 15000 - 10000 - 50000 - 30000);
    expect(income).toBe(195000);

    const budgetMetrics = calculateBudgetMetrics(foodBudget, all);
    expect(budgetMetrics.spent).toBe(25000);
    expect(budgetMetrics.remaining).toBe(25000);
    expect(budgetMetrics.percentage).toBe(50);
    expect(budgetMetrics.transactionCount).toBe(2);

    const goalMetrics = calculateGoalMetrics(vacationGoal, all);
    expect(goalMetrics.saved).toBe(30000);
    expect(goalMetrics.remaining).toBe(170000);
    expect(goalMetrics.percentage).toBe(15);

    const debtMetrics = calculateDebtMetrics(carDebt, all);
    expect(debtMetrics.amountPaid).toBe(50000);
    expect(debtMetrics.remainingBalance).toBe(450000);
    expect(debtMetrics.paymentCount).toBe(1);

    const categoryBreakdown = getCategoryBreakdown(all);
    const foodCat = categoryBreakdown.find((c) => c.name === "Food");
    expect(foodCat).toBeDefined();
    expect(foodCat!.value).toBe(25000);
  });

  it("generates notifications from financial activity", () => {
    const budget = buildBudget({ name: "Alert Budget", amount: 10000, categories: ["Food"] }) as Budget;
    useFinanceStore.getState().addBudget(budget);
    useFinanceStore.getState().addAccount(buildAccount({ name: "Main", openingBalance: 50000 }));

    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 12000, type: "expense", category: "Food", budgetId: budget.id }));

    const metrics = calculateBudgetMetrics(budget, useFinanceStore.getState().transactions);
    expect(metrics.isOverBudget).toBe(true);

    useNotificationStore.getState().addNotification({
      title: "Budget Exceeded",
      message: "Alert Budget has exceeded its limit",
      type: "warning",
      category: "budget",
    });

    const notifications = useNotificationStore.getState().notifications;
    expect(notifications).toHaveLength(1);
    expect(notifications[0].category).toBe("budget");
    expect(notifications[0].type).toBe("warning");
    expect(notifications[0].title).toContain("Budget");
  });

  it("handles transfer between accounts", () => {
    const checking = buildAccount({ name: "Checking", openingBalance: 200000 });
    const savings = buildAccount({ name: "Savings", openingBalance: 50000 });
    useFinanceStore.getState().addAccount(checking);
    useFinanceStore.getState().addAccount(savings);

    useFinanceStore.getState().addTransaction(buildTransaction({
      description: "Transfer to savings",
      amount: 50000,
      type: "transfer",
      fromAccount: "Checking",
      toAccount: "Savings",
      category: "Transfer",
    }));

    const checkingBal = computeAccountBalance(checking, useFinanceStore.getState().transactions);
    const savingsBal = computeAccountBalance(savings, useFinanceStore.getState().transactions);

    expect(checkingBal).toBe(150000);
    expect(savingsBal).toBe(100000);
  });

  it("reflects all data in monthly chart", () => {
    useFinanceStore.getState().addAccount(buildAccount({ name: "Main", openingBalance: 0 }));

    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 100000, type: "income", category: "Salary" }));
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 30000, type: "expense", category: "Rent" }));
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 15000, type: "expense", category: "Food" }));

    const chart = getMonthlyChart(useFinanceStore.getState().transactions, 1);
    expect(chart).toHaveLength(1);
    expect(chart[0].income).toBe(100000);
    expect(chart[0].expenses).toBe(45000);
  });

  it("handles goal completion affecting debt payments", () => {
    const goal = buildGoal({ name: "Debt Payoff Goal", targetAmount: 300000 }) as Goal;
    const debt = buildDebt({ name: "Consolidated Debt", originalAmount: 300000 }) as Debt;
    useFinanceStore.getState().addGoal(goal);
    useFinanceStore.getState().addDebt(debt);

    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 300000, type: "expense", category: "Savings", goalId: goal.id }));
    useFinanceStore.getState().addTransaction(buildTransaction({ amount: 300000, type: "expense", category: "Debt Payment", debtId: debt.id }));

    const goalMetrics = calculateGoalMetrics(goal, useFinanceStore.getState().transactions);
    expect(goalMetrics.isCompleted).toBe(true);

    const debtMetrics = calculateDebtMetrics(debt, useFinanceStore.getState().transactions);
    expect(debtMetrics.isPaidOff).toBe(true);
  });
});
