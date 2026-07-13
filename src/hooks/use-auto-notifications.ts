import { useEffect, useRef } from "react";
import { useFinanceStore, getBudgetPercentSpent, getGoalDaysRemaining } from "@/store/finance";
import { getNotificationService, getSettingsService } from "@/services/service-provider";
import { notify } from "@/services/notifications";
import { formatCurrency } from "@/lib/format";

const BUDGET_WARNING_PCT = 80;
const BUDGET_CRITICAL_PCT = 95;
const LARGE_EXPENSE_THRESHOLD = 100_000;
const LARGE_INCOME_THRESHOLD = 500_000;
const LOW_BALANCE_THRESHOLD = 10_000;
const DEBT_DUE_THRESHOLD_DAYS = 7;
const DEADLINE_THRESHOLD_DAYS = 7;
const STALLED_THRESHOLD_DAYS = 30;

const notified = new Set<string>();

function key(domain: string, id: string, type: string) {
  return `${domain}-${id}-${type}`;
}
function isNotified(domain: string, id: string, type: string) {
  return notified.has(key(domain, id, type));
}
function markNotified(domain: string, id: string, type: string) {
  notified.add(key(domain, id, type));
}
function clearNotified(domain: string, id: string, type: string) {
  notified.delete(key(domain, id, type));
}

export function useAutoNotifications() {
  const budgets = useFinanceStore((s) => s.budgets);
  const goals = useFinanceStore((s) => s.goals);
  const goalContributions = useFinanceStore((s) => s.goalContributions);
  const goalMilestones = useFinanceStore((s) => s.goalMilestones);
  const markMilestoneNotified = useFinanceStore((s) => s.markMilestoneNotified);
  const debts = useFinanceStore((s) => s.debts);
  const transactions = useFinanceStore((s) => s.transactions);
  const accounts = useFinanceStore((s) => s.accounts);

  console.log({
  goalContributions,
  transactions,
  budgets,
 goals,
  debts,
  accounts,
});

  const prevBudgetPct = useRef(new Map<string, number>());
  const prevDebtBalance = useRef(new Map<string, number>());
  const prevAccountBalance = useRef(new Map<string, number>());
  const seenContributions = useRef(new Set(goalContributions.map((c) => c.id)));
  const seenTransactions = useRef(new Set(transactions.map((t) => t.id)));

  useEffect(() => {
    const prefs = getNotificationService().getPreferences();
    const currency = getSettingsService().get().localization.currency;

    if (prefs.budgetAlerts) {
      for (const budget of budgets) {
        const pct = getBudgetPercentSpent(budget);
        const prev = prevBudgetPct.current.get(budget.id) ?? 0;
        prevBudgetPct.current.set(budget.id, pct);
        if (pct <= prev) continue;

        if (pct > 100 && !isNotified("budget", budget.id, "exceeded")) {
          markNotified("budget", budget.id, "exceeded");
          notify.error(`${budget.name} budget exceeded`, `Spending has surpassed the budget by ${(pct - 100).toFixed(1)}%.`, "budget", { duration: 8000 });
        } else if (pct >= BUDGET_CRITICAL_PCT && !isNotified("budget", budget.id, "critical")) {
          markNotified("budget", budget.id, "critical");
          notify.warning(`${budget.name} is nearly exceeded`, `${pct.toFixed(1)}% of the budget has been used.`, "budget", { duration: 6000 });
        } else if (pct >= BUDGET_WARNING_PCT && !isNotified("budget", budget.id, "warning")) {
          markNotified("budget", budget.id, "warning");
          notify.warning(`${budget.name} is nearing its limit`, `${pct.toFixed(1)}% of the budget has been used. Consider adjusting spending.`, "budget", { duration: 5000 });
        }
      }

      for (const budgetId of prevBudgetPct.current.keys()) {
        const budget = budgets.find((b) => b.id === budgetId);
        if (!budget) { prevBudgetPct.current.delete(budgetId); continue; }
        const pct = getBudgetPercentSpent(budget);
        if (pct < BUDGET_WARNING_PCT) clearNotified("budget", budget.id, "warning");
        if (pct < BUDGET_CRITICAL_PCT) clearNotified("budget", budget.id, "critical");
        if (pct <= 100) clearNotified("budget", budget.id, "exceeded");
      }
    }

    if (prefs.savingsAlerts) {
      for (const contrib of goalContributions) {
        if (seenContributions.current.has(contrib.id)) continue;
        seenContributions.current.add(contrib.id);
        const goal = goals.find((g) => g.id === contrib.goalId);
        if (goal && !isNotified("goal", goal.id, "contribution")) {
          markNotified("goal", goal.id, "contribution");
          notify.success(`Contribution to ${goal.name}`, `+${formatCurrency(contrib.amount, currency)} added. You've now saved ${formatCurrency(goal.saved, currency)} towards your target.`, "goal", { duration: 3000 });
        }
      }

      for (const milestone of goalMilestones) {
        if (milestone.notified) continue;
        const goal = goals.find((g) => g.id === milestone.goalId);
        if (goal && goal.saved >= (goal.target * milestone.pct) / 100) {
          notify.success(`Milestone Reached for ${goal.name}`, `${milestone.pct}% of your goal achieved.`, "milestone", { duration: 5000 });
          markMilestoneNotified(milestone.id);
        }
      }

      for (const goal of goals) {
        if (goal.saved >= goal.target && !isNotified("goal", goal.id, "completed")) {
          markNotified("goal", goal.id, "completed");
          notify.success(`Goal Completed: ${goal.name}`, `You've saved ${formatCurrency(goal.saved, currency)} out of your ${formatCurrency(goal.target, currency)} target!`, "goal", { duration: 10000 });
        }
      }

      for (const goal of goals) {
        const days = getGoalDaysRemaining(goal);
        if (days > 0 && days <= DEADLINE_THRESHOLD_DAYS && goal.saved < goal.target && !isNotified("goal", goal.id, "deadline")) {
          markNotified("goal", goal.id, "deadline");
          notify.warning(`Deadline Approaching for ${goal.name}`, `Only ${days} day(s) left to reach your goal!`, "deadline", { duration: 8000 });
        } else if (days > DEADLINE_THRESHOLD_DAYS) {
          clearNotified("goal", goal.id, "deadline");
        }
      }

      const now = new Date();
      for (const goal of goals) {
        if (goal.saved >= goal.target) continue;
        const lastDate = goal.lastContributionDate ? new Date(goal.lastContributionDate) : new Date(goal.createdAt);
        const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince >= STALLED_THRESHOLD_DAYS && !isNotified("goal", goal.id, "stalled")) {
          markNotified("goal", goal.id, "stalled");
          notify.info(`Progress Stalled for ${goal.name}`, `It's been ${daysSince} days since your last contribution. Keep going!`, "goal", { duration: 8000 });
        } else if (daysSince < STALLED_THRESHOLD_DAYS) {
          clearNotified("goal", goal.id, "stalled");
        }
      }
    }

    if (prefs.debtReminders) {
      const nowMs = Date.now();
      for (const debt of debts) {
        const dueMs = new Date(debt.dueDate).getTime();
        const daysUntilDue = Math.ceil((dueMs - nowMs) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0 && debt.balance > 0 && !isNotified("debt", debt.id, "overdue")) {
          markNotified("debt", debt.id, "overdue");
          notify.error(`Payment Overdue: ${debt.name}`, `Your ${debt.name} payment of ${formatCurrency(debt.balance, currency)} was due ${Math.abs(daysUntilDue)} day(s) ago.`, "debt", { duration: 10000 });
        }

        if (daysUntilDue >= 0 && daysUntilDue <= DEBT_DUE_THRESHOLD_DAYS && debt.balance > 0 && !isNotified("debt", debt.id, "due")) {
          markNotified("debt", debt.id, "due");
          const label = daysUntilDue === 0 ? "today" : `in ${daysUntilDue} day(s)`;
          notify.warning(`Payment Due for ${debt.name}`, `${formatCurrency(debt.balance, currency)} is due ${label}. Min payment: ${formatCurrency(debt.minPayment, currency)}.`, "debt", { duration: 8000 });
        }

        if (debt.balance <= 0) {
          clearNotified("debt", debt.id, "overdue");
          clearNotified("debt", debt.id, "due");
        }

        const prevBal = prevDebtBalance.current.get(debt.id) ?? debt.balance;
        prevDebtBalance.current.set(debt.id, debt.balance);
        if (prevBal > 0 && debt.balance <= 0 && !isNotified("debt", debt.id, "paid")) {
          markNotified("debt", debt.id, "paid");
          notify.success(`Debt Paid Off: ${debt.name}`, `You've fully paid off your ${debt.name} debt. Congratulations!`, "debt", { duration: 10000 });
        }
      }

      for (const debtId of prevDebtBalance.current.keys()) {
        if (!debts.find((d) => d.id === debtId)) prevDebtBalance.current.delete(debtId);
      }
    }

    if (prefs.largeTransactionAlerts) {
      for (const tx of transactions) {
        if (seenTransactions.current.has(tx.id)) continue;
        seenTransactions.current.add(tx.id);

        if (tx.type === "expense" && tx.amount >= LARGE_EXPENSE_THRESHOLD) {
          notify.warning(`Large Expense: ${tx.description}`, `${formatCurrency(tx.amount, currency)} spent on ${tx.category}.`, "transaction", { duration: 6000 });
        }
        if (tx.type === "income" && tx.amount >= LARGE_INCOME_THRESHOLD) {
          notify.success(`Large Income: ${tx.description}`, `${formatCurrency(tx.amount, currency)} received from ${tx.category}.`, "transaction", { duration: 6000 });
        }
        if (tx.type === "transfer") {
          notify.info("Transfer Completed", `${formatCurrency(tx.amount, currency)} transferred from ${tx.fromAccount ?? "?"} to ${tx.toAccount ?? "?"}.`, "transaction", { duration: 4000 });
        }
      }
    }

    if (prefs.accountAlerts) {
      for (const account of accounts) {
        const prevBal = prevAccountBalance.current.get(account.id) ?? account.balance;
        prevAccountBalance.current.set(account.id, account.balance);

        if (account.balance < 0 && prevBal >= 0 && !isNotified("account", account.id, "negative")) {
          markNotified("account", account.id, "negative");
          notify.error(`Negative Balance: ${account.name}`, `${account.name} has a negative balance of ${formatCurrency(account.balance, currency)}. Please take action.`, "account", { duration: 10000 });
        }

        if (account.balance > 0 && account.balance < LOW_BALANCE_THRESHOLD && prevBal >= LOW_BALANCE_THRESHOLD && !isNotified("account", account.id, "low-balance")) {
          markNotified("account", account.id, "low-balance");
          notify.warning(`Low Balance: ${account.name}`, `${account.name} has only ${formatCurrency(account.balance, currency)} remaining.`, "account", { duration: 8000 });
        }

        if (account.balance >= 0) clearNotified("account", account.id, "negative");
        if (account.balance >= LOW_BALANCE_THRESHOLD) clearNotified("account", account.id, "low-balance");
      }

      for (const acctId of prevAccountBalance.current.keys()) {
        if (!accounts.find((a) => a.id === acctId)) prevAccountBalance.current.delete(acctId);
      }
    }
  }, [budgets, goals, goalContributions, goalMilestones, markMilestoneNotified, debts, transactions, accounts]);
}
