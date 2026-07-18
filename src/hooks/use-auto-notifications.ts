import { useEffect, useRef } from "react";
import { useFinanceStore, getGoalDaysRemaining, calculateGoalMetrics } from "@/store/finance";
import { calculateBudgetMetrics, getBudgetPeriodDaysRemaining, isBudgetPeriodEnded } from "@/services/budget-matching";
import { useSettingsStore } from "@/store/settings";
import { getNotificationService } from "@/services/service-provider";
import { notify } from "@/services/notifications";
import { formatCurrency } from "@/lib/format";
import { computeAccountBalance } from "@/services/account-balance";
import { calculateDebtMetrics } from "@/store/finance";

const BUDGET_WARNING_PCT = 80;
const BUDGET_CRITICAL_PCT = 95;
const LARGE_EXPENSE_THRESHOLD = 100_000;
const LARGE_INCOME_THRESHOLD = 500_000;
const LOW_BALANCE_THRESHOLD = 10_000;
const DEBT_DUE_THRESHOLD_DAYS = 7;
const GOAL_DEADLINE_SOON_DAYS = 7;
const GOAL_DEADLINE_IMMINENT_DAYS = 3;
const STALLED_THRESHOLD_DAYS = 30;
const BUDGET_ENDING_THRESHOLD_DAYS = 3;

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

function safeNotify(fn: () => Promise<string> | void) {
  try { const r = fn(); if (r && typeof r.catch === 'function') r.catch(() => {}); } catch { /* noop */ }
}

export function useAutoNotifications() {
  const budgets = useFinanceStore((s) => s.budgets);
  const goals = useFinanceStore((s) => s.goals);
  const debts = useFinanceStore((s) => s.debts);
  const transactions = useFinanceStore((s) => s.transactions);
  const accounts = useFinanceStore((s) => s.accounts);

  const prevBudgetPct = useRef(new Map<string, number>());
  const prevBudgetOver = useRef(new Map<string, boolean>());
  const prevDebtBalance = useRef(new Map<string, number>());
  const prevDebtPct = useRef(new Map<string, number>());
  const prevAccountBalance = useRef(new Map<string, number>());
  const seenTransactions = useRef(new Set(transactions.map((t) => t.id)));

  useEffect(() => {
    const prefs = getNotificationService().getPreferences();
    const currency = useSettingsStore.getState().settings.localization.currency;

    if (prefs.budgetAlerts) {
      for (const budget of budgets) {
        try {
          const pct = calculateBudgetMetrics(budget, transactions).percentage;
          const prev = prevBudgetPct.current.get(budget.id) ?? 0;
          prevBudgetPct.current.set(budget.id, pct);

          // Budget ending within 3 days
          if (prefs.budgetEndingAlerts ?? true) {
            const daysLeft = getBudgetPeriodDaysRemaining(budget);
            if (daysLeft > 0 && daysLeft <= BUDGET_ENDING_THRESHOLD_DAYS && !isNotified("budget", budget.id, "ending")) {
              markNotified("budget", budget.id, "ending");
              safeNotify(() => notify.warning(`${budget.name} ending soon`, `Only ${daysLeft} day(s) left in this budget period.`, "budget", { duration: 6000 }));
            } else if (daysLeft > BUDGET_ENDING_THRESHOLD_DAYS) {
              clearNotified("budget", budget.id, "ending");
            }
          }

          // Budget ended
          if (prefs.budgetEndedAlerts ?? true) {
            const ended = isBudgetPeriodEnded(budget);
            const wasOver = prevBudgetOver.current.get(budget.id) ?? false;
            if (ended && !wasOver && !isNotified("budget", budget.id, "ended")) {
              markNotified("budget", budget.id, "ended");
              safeNotify(() => notify.info(`${budget.name} period ended`, `The budget period has ended. ${pct.toFixed(1)}% of the budget was used.`, "budget", { duration: 6000 }));
            }
            prevBudgetOver.current.set(budget.id, ended);
            if (!ended) clearNotified("budget", budget.id, "ended");
          }

          if (pct <= prev) continue;

          // 50% spent notification
          if (prefs.budgetThresholdAlerts ?? true) {
            if (pct >= 50 && prev < 50 && !isNotified("budget", budget.id, "half")) {
              markNotified("budget", budget.id, "half");
              safeNotify(() => notify.info(`${budget.name} half used`, `50% of the ${budget.name} budget has been spent.`, "budget", { duration: 5000 }));
            }
          }

          // 100% spent notification (before exceeded)
          if (prefs.budgetThresholdAlerts ?? true) {
            if (pct >= 100 && prev < 100 && !isNotified("budget", budget.id, "fully-spent")) {
              markNotified("budget", budget.id, "fully-spent");
              safeNotify(() => notify.warning(`${budget.name} fully spent`, `100% of the ${budget.name} budget has been used.`, "budget", { duration: 6000 }));
            }
          }

          // Over Budget notification (just crossed over)
          if (prefs.budgetThresholdAlerts ?? true) {
            if (pct > 100 && prev <= 100 && !isNotified("budget", budget.id, "over")) {
              markNotified("budget", budget.id, "over");
              safeNotify(() => notify.error(`${budget.name} over budget`, `Spending has exceeded the budget by ${(pct - 100).toFixed(1)}%.`, "budget", { duration: 8000 }));
            }
          }

          if (pct > 100 && !isNotified("budget", budget.id, "exceeded")) {
            markNotified("budget", budget.id, "exceeded");
            safeNotify(() => notify.error(`${budget.name} budget exceeded`, `Spending has surpassed the budget by ${(pct - 100).toFixed(1)}%.`, "budget", { duration: 8000 }));
          } else if (pct >= BUDGET_CRITICAL_PCT && !isNotified("budget", budget.id, "critical")) {
            markNotified("budget", budget.id, "critical");
            safeNotify(() => notify.warning(`${budget.name} is nearly exceeded`, `${pct.toFixed(1)}% of the budget has been used.`, "budget", { duration: 6000 }));
          } else if (pct >= BUDGET_WARNING_PCT && !isNotified("budget", budget.id, "warning")) {
            markNotified("budget", budget.id, "warning");
            safeNotify(() => notify.warning(`${budget.name} is nearing its limit`, `${pct.toFixed(1)}% of the budget has been used. Consider adjusting spending.`, "budget", { duration: 5000 }));
          }
        } catch {
          // Notification failures must never block budgeting operations
        }
      }

      for (const budgetId of prevBudgetPct.current.keys()) {
        try {
          const budget = budgets.find((b) => b.id === budgetId);
          if (!budget) { prevBudgetPct.current.delete(budgetId); prevBudgetOver.current.delete(budgetId); continue; }
          const pct = calculateBudgetMetrics(budget, transactions).percentage;
          if (pct < BUDGET_WARNING_PCT) clearNotified("budget", budget.id, "warning");
          if (pct < BUDGET_CRITICAL_PCT) clearNotified("budget", budget.id, "critical");
          if (pct <= 100) clearNotified("budget", budget.id, "exceeded");
          if (pct < 100) clearNotified("budget", budget.id, "fully-spent");
          if (pct <= 100) clearNotified("budget", budget.id, "over");
          if (pct < 50) clearNotified("budget", budget.id, "half");
        } catch { /* noop */ }
      }
    }

    if (prefs.savingsAlerts) {
      const transactions = useFinanceStore.getState().transactions;

      for (const goal of goals) {
        try {
          const metrics = calculateGoalMetrics(goal, transactions);

          if (metrics.isCompleted && !isNotified("goal", goal.id, "completed")) {
            markNotified("goal", goal.id, "completed");
            safeNotify(() => notify.success(`Goal Completed: ${goal.name}`, `You've saved ${formatCurrency(metrics.saved, currency)} out of your ${formatCurrency(goal.targetAmount, currency)} target!`, "goal", { duration: 10000 }));
          }

          if (metrics.isOverTarget && !metrics.isCompleted && !isNotified("goal", goal.id, "exceeded")) {
            markNotified("goal", goal.id, "exceeded");
            safeNotify(() => notify.success(`Goal Exceeded: ${goal.name}`, `You've saved ${formatCurrency(metrics.saved, currency)} — over your ${formatCurrency(goal.targetAmount, currency)} target!`, "goal", { duration: 10000 }));
          }

          if (metrics.isExpired && !isNotified("goal", goal.id, "overdue")) {
            markNotified("goal", goal.id, "overdue");
            safeNotify(() => notify.error(`Goal Overdue: ${goal.name}`, `Your goal was due but only ${formatCurrency(metrics.saved, currency)} of ${formatCurrency(goal.targetAmount, currency)} was saved.`, "goal", { duration: 10000 }));
          } else if (!metrics.isExpired) {
            clearNotified("goal", goal.id, "overdue");
          }

          const days = getGoalDaysRemaining(goal);
          if (days > 0 && days <= GOAL_DEADLINE_IMMINENT_DAYS && !metrics.isCompleted && !isNotified("goal", goal.id, "deadline-3d")) {
            markNotified("goal", goal.id, "deadline-3d");
            safeNotify(() => notify.warning(`Due in ${days} day(s): ${goal.name}`, `Only ${days} day(s) left! You still need ${formatCurrency(metrics.remaining, currency)}.`, "deadline", { duration: 8000 }));
          } else if (days > GOAL_DEADLINE_IMMINENT_DAYS) {
            clearNotified("goal", goal.id, "deadline-3d");
          }

          if (days > 0 && days <= GOAL_DEADLINE_SOON_DAYS && days > GOAL_DEADLINE_IMMINENT_DAYS && !metrics.isCompleted && !isNotified("goal", goal.id, "deadline-7d")) {
            markNotified("goal", goal.id, "deadline-7d");
            safeNotify(() => notify.warning(`Due in ${days} day(s): ${goal.name}`, `Your goal deadline is approaching. Stay on track with consistent contributions.`, "deadline", { duration: 8000 }));
          } else if (days > GOAL_DEADLINE_SOON_DAYS) {
            clearNotified("goal", goal.id, "deadline-7d");
          }

          if (prefs.goalMilestoneAlerts) {
            const milestones = [25, 50, 75, 90];
            for (const m of milestones) {
              const key = `milestone-${m}`;
              if (metrics.percentage >= m && !metrics.isCompleted && !isNotified("goal", goal.id, key)) {
                markNotified("goal", goal.id, key);
                if (m === 90) {
                  safeNotify(() => notify.success(`Almost there: ${goal.name}`, `You're 90% of the way to your goal! Just ${formatCurrency(metrics.remaining, currency)} to go.`, "milestone", { duration: 8000 }));
                } else {
                  safeNotify(() => notify.info(`${m}% Reached: ${goal.name}`, `You've completed ${m}% of your savings target for ${goal.name}. Keep going!`, "milestone", { duration: 6000 }));
                }
              } else if (metrics.percentage < m) {
                clearNotified("goal", goal.id, key);
              }
            }
          }

          if (metrics.transactionCount === 0 && !metrics.isCompleted && !isNotified("goal", goal.id, "stalled")) {
            const daysSinceStart = Math.floor((Date.now() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceStart >= STALLED_THRESHOLD_DAYS) {
              markNotified("goal", goal.id, "stalled");
              safeNotify(() => notify.info(`No Activity for ${goal.name}`, `It's been ${daysSinceStart} days since this goal was created. Create matching transactions to track progress.`, "goal", { duration: 8000 }));
            }
          } else if (metrics.transactionCount > 0) {
            clearNotified("goal", goal.id, "stalled");
          }
        } catch { /* noop */ }
      }
    }

    if (prefs.debtReminders) {
      const nowMs = Date.now();
      for (const debt of debts) {
        try {
          const metrics = calculateDebtMetrics(debt, useFinanceStore.getState().transactions);
          const dueMs = new Date(debt.dueDate).getTime();
          const daysUntilDue = Math.ceil((dueMs - nowMs) / (1000 * 60 * 60 * 24));

          if (daysUntilDue < 0 && !metrics.isPaidOff && !isNotified("debt", debt.id, "overdue")) {
            markNotified("debt", debt.id, "overdue");
            safeNotify(() => notify.error(`Payment Overdue: ${debt.name}`, `Your ${debt.name} payment of ${formatCurrency(metrics.remainingBalance, currency)} was due ${Math.abs(daysUntilDue)} day(s) ago.`, "debt", { duration: 10000 }));
          }

          if (daysUntilDue >= 0 && daysUntilDue <= DEBT_DUE_THRESHOLD_DAYS && !metrics.isPaidOff && !isNotified("debt", debt.id, "due")) {
            markNotified("debt", debt.id, "due");
            const label = daysUntilDue === 0 ? "today" : `in ${daysUntilDue} day(s)`;
            safeNotify(() => notify.warning(`Payment Due for ${debt.name}`, `${formatCurrency(metrics.remainingBalance, currency)} is due ${label}. Min payment: ${formatCurrency(debt.minimumPayment, currency)}.`, "debt", { duration: 8000 }));
          }

          if (metrics.isPaidOff) {
            clearNotified("debt", debt.id, "overdue");
            clearNotified("debt", debt.id, "due");
          }

          const prevBal = prevDebtBalance.current.get(debt.id) ?? metrics.remainingBalance;
          prevDebtBalance.current.set(debt.id, metrics.remainingBalance);
          if (prevBal > 0 && metrics.isPaidOff && !isNotified("debt", debt.id, "paid")) {
            markNotified("debt", debt.id, "paid");
            safeNotify(() => notify.success(`Debt Paid Off: ${debt.name}`, `You've fully paid off your ${debt.name} debt. Congratulations!`, "debt", { duration: 10000 }));
          }

          if (prefs.debtReminders && prefs.goalMilestoneAlerts) {
            const milestones = [25, 50, 75, 90];
            const prevPct = prevDebtPct.current.get(debt.id) ?? 0;
            prevDebtPct.current.set(debt.id, metrics.percentagePaid);
            for (const m of milestones) {
              if (metrics.percentagePaid >= m && prevPct < m && !isNotified("debt", debt.id, `milestone-${m}`)) {
                markNotified("debt", debt.id, `milestone-${m}`);
                if (m === 90) {
                  safeNotify(() => notify.success(`Almost there: ${debt.name}`, `You're 90% of the way to paying off ${debt.name}! Only ${formatCurrency(metrics.remainingBalance, currency)} to go.`, "milestone", { duration: 8000 }));
                } else {
                  safeNotify(() => notify.info(`${m}% Paid: ${debt.name}`, `You've paid ${m}% of your ${debt.name} debt. Keep going!`, "milestone", { duration: 6000 }));
                }
              } else if (metrics.percentagePaid < m) {
                clearNotified("debt", debt.id, `milestone-${m}`);
              }
            }
          }

          if (metrics.isPaidOff) {
            for (const m of [25, 50, 75, 90]) {
              clearNotified("debt", debt.id, `milestone-${m}`);
            }
          }
        } catch { /* noop */ }
      }

      for (const debtId of prevDebtBalance.current.keys()) {
        if (!debts.find((d) => d.id === debtId)) { prevDebtBalance.current.delete(debtId); prevDebtPct.current.delete(debtId); }
      }
    }

    if (prefs.largeTransactionAlerts) {
      for (const tx of transactions) {
        try {
          if (seenTransactions.current.has(tx.id)) continue;
          seenTransactions.current.add(tx.id);

          if (tx.type === "expense" && tx.amount >= LARGE_EXPENSE_THRESHOLD) {
            safeNotify(() => notify.warning(`Large Expense: ${tx.description}`, `${formatCurrency(tx.amount, currency)} spent on ${tx.category}.`, "transaction", { duration: 6000 }));
          }
          if (tx.type === "income" && tx.amount >= LARGE_INCOME_THRESHOLD) {
            safeNotify(() => notify.success(`Large Income: ${tx.description}`, `${formatCurrency(tx.amount, currency)} received from ${tx.category}.`, "transaction", { duration: 6000 }));
          }
          if (tx.type === "transfer") {
            safeNotify(() => notify.info("Transfer Completed", `${formatCurrency(tx.amount, currency)} transferred from ${tx.fromAccount ?? "?"} to ${tx.toAccount ?? "?"}.`, "transaction", { duration: 4000 }));
          }
        } catch { /* noop */ }
      }
    }

    if (prefs.accountAlerts) {
      for (const account of accounts) {
        try {
          const bal = computeAccountBalance(account, transactions);
          const prevBal = prevAccountBalance.current.get(account.id) ?? bal;
          prevAccountBalance.current.set(account.id, bal);

          if (bal < 0 && prevBal >= 0 && !isNotified("account", account.id, "negative")) {
            markNotified("account", account.id, "negative");
            safeNotify(() => notify.error(`Negative Balance: ${account.name}`, `${account.name} has a negative balance of ${formatCurrency(bal, currency)}. Please take action.`, "account", { duration: 10000 }));
          }

          if (bal > 0 && bal < LOW_BALANCE_THRESHOLD && prevBal >= LOW_BALANCE_THRESHOLD && !isNotified("account", account.id, "low-balance")) {
            markNotified("account", account.id, "low-balance");
            safeNotify(() => notify.warning(`Low Balance: ${account.name}`, `${account.name} has only ${formatCurrency(bal, currency)} remaining.`, "account", { duration: 8000 }));
          }

          if (bal >= 0) clearNotified("account", account.id, "negative");
          if (bal >= LOW_BALANCE_THRESHOLD) clearNotified("account", account.id, "low-balance");
        } catch { /* noop */ }
      }

      for (const acctId of prevAccountBalance.current.keys()) {
        if (!accounts.find((a) => a.id === acctId)) prevAccountBalance.current.delete(acctId);
      }
    }
    }, [budgets, goals, debts, transactions, accounts]);
}
