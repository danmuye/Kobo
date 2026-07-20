import { useEffect, useRef } from "react";
import { useFinanceStore, getGoalDaysRemaining, calculateGoalMetrics } from "@/store/finance";
import { calculateBudgetMetrics, getBudgetPeriodDaysRemaining, isBudgetPeriodEnded } from "@/services/budget-matching";
import { useSettingsStore } from "@/store/settings";
import { getNotificationService } from "@/services/service-provider";
import { emitFinancialEvent } from "@/services/notifications";
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

const prevBudgetPct = new Map<string, number>();
const prevBudgetOver = new Map<string, boolean>();
const prevDebtBalance = new Map<string, number>();
const prevDebtPct = new Map<string, number>();
const prevAccountBalance = new Map<string, number>();

export function useAutoNotifications() {
  const budgets = useFinanceStore((s) => s.budgets);
  const goals = useFinanceStore((s) => s.goals);
  const debts = useFinanceStore((s) => s.debts);
  const transactions = useFinanceStore((s) => s.transactions);
  const accounts = useFinanceStore((s) => s.accounts);

  const seenTransactions = useRef(new Set(transactions.map((t) => t.id)));

  useEffect(() => {
    const prefs = getNotificationService().getPreferences();
    const currency = useSettingsStore.getState().settings.localization.currency;

    if (prefs.budgetAlerts) {
      for (const budget of budgets) {
        try {
          const pct = calculateBudgetMetrics(budget, transactions).percentage;
          const prev = prevBudgetPct.get(budget.id) ?? 0;
          prevBudgetPct.set(budget.id, pct);

          if (prefs.budgetEndingAlerts ?? true) {
            const daysLeft = getBudgetPeriodDaysRemaining(budget);
            if (daysLeft > 0 && daysLeft <= BUDGET_ENDING_THRESHOLD_DAYS) {
              emitFinancialEvent("budget:ending", budget.id, budget.name, undefined, { days: String(daysLeft), pct: pct.toFixed(1) });
            }
          }

          if (prefs.budgetEndedAlerts ?? true) {
            const ended = isBudgetPeriodEnded(budget);
            const wasOver = prevBudgetOver.get(budget.id) ?? false;
            if (ended && !wasOver) {
              emitFinancialEvent("budget:ended", budget.id, budget.name, undefined, { pct: pct.toFixed(1) });
            }
            prevBudgetOver.set(budget.id, ended);
          }

          if (pct <= prev) continue;

          if (prefs.budgetThresholdAlerts ?? true) {
            if (pct >= 50 && prev < 50) {
              emitFinancialEvent("budget:threshold", `${budget.id}-half`, budget.name, undefined, { pct: "50" });
            }
          }

          if (prefs.budgetThresholdAlerts ?? true) {
            if (pct >= 100 && prev < 100) {
              emitFinancialEvent("budget:fully-spent", budget.id, budget.name, undefined, { pct: "100" });
            }
          }

          if (prefs.budgetThresholdAlerts ?? true) {
            if (pct > 100 && prev <= 100) {
              emitFinancialEvent("budget:exceeded", budget.id, budget.name, undefined, { pct: pct.toFixed(1), overPct: (pct - 100).toFixed(1) });
            }
          }

          if (pct > 100) {
            emitFinancialEvent("budget:exceeded", budget.id, budget.name, undefined, { pct: pct.toFixed(1), overPct: (pct - 100).toFixed(1) });
          } else if (pct >= BUDGET_CRITICAL_PCT) {
            emitFinancialEvent("budget:critical", budget.id, budget.name, undefined, { pct: pct.toFixed(1) });
          } else if (pct >= BUDGET_WARNING_PCT) {
            emitFinancialEvent("budget:warning", budget.id, budget.name, undefined, { pct: pct.toFixed(1) });
          }
        } catch {
          // Notification failures must never block budgeting operations
        }
      }
    }

    if (prefs.savingsAlerts) {
      const allTransactions = useFinanceStore.getState().transactions;

      for (const goal of goals) {
        try {
          const metrics = calculateGoalMetrics(goal, allTransactions);

          if (metrics.isCompleted) {
            emitFinancialEvent("goal:completed", goal.id, goal.name, undefined, {
              saved: formatCurrency(metrics.saved, currency),
              target: formatCurrency(goal.targetAmount, currency),
            });
          }

          if (metrics.isOverTarget && !metrics.isCompleted) {
            emitFinancialEvent("goal:exceeded", goal.id, goal.name, undefined, {
              saved: formatCurrency(metrics.saved, currency),
              target: formatCurrency(goal.targetAmount, currency),
            });
          }

          if (metrics.isExpired) {
            emitFinancialEvent("goal:overdue", goal.id, goal.name, undefined, {
              saved: formatCurrency(metrics.saved, currency),
              target: formatCurrency(goal.targetAmount, currency),
            });
          }

          const days = getGoalDaysRemaining(goal);
          const detail = `Only ${days} day(s) left! You still need ${formatCurrency(metrics.remaining, currency)}.`;
          if (days > 0 && days <= GOAL_DEADLINE_IMMINENT_DAYS && !metrics.isCompleted) {
            emitFinancialEvent("goal:deadline", goal.id, goal.name, undefined, { days: String(days), detail });
          }

          if (days > GOAL_DEADLINE_SOON_DAYS && !metrics.isCompleted) {
            // Not close enough for deadline notification
          }

          if (prefs.goalMilestoneAlerts) {
            const milestones = [25, 50, 75, 90];
            for (const m of milestones) {
              if (metrics.percentage >= m && !metrics.isCompleted) {
                emitFinancialEvent("goal:milestone", `${goal.id}-${m}`, goal.name, undefined, { pct: String(m) });
              }
            }
          }

          if (metrics.transactionCount === 0 && !metrics.isCompleted) {
            const daysSinceStart = Math.floor((Date.now() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceStart >= STALLED_THRESHOLD_DAYS) {
              emitFinancialEvent("goal:stalled", goal.id, goal.name, undefined, { days: String(daysSinceStart) });
            }
          }
        } catch { /* noop */ }
      }
    }

    if (prefs.debtReminders) {
      const nowMs = Date.now();
      const allTransactions = useFinanceStore.getState().transactions;

      for (const debt of debts) {
        try {
          const metrics = calculateDebtMetrics(debt, allTransactions);
          const dueMs = new Date(debt.dueDate).getTime();
          const daysUntilDue = Math.ceil((dueMs - nowMs) / (1000 * 60 * 60 * 24));

          if (daysUntilDue < 0 && !metrics.isPaidOff) {
            emitFinancialEvent("debt:overdue", debt.id, debt.name, undefined, {
              balance: formatCurrency(metrics.remainingBalance, currency),
              days: String(Math.abs(daysUntilDue)),
            });
          }

          if (daysUntilDue >= 0 && daysUntilDue <= DEBT_DUE_THRESHOLD_DAYS && !metrics.isPaidOff) {
            const label = daysUntilDue === 0 ? "today" : `in ${daysUntilDue} day(s)`;
            emitFinancialEvent("debt:due", debt.id, debt.name, undefined, {
              balance: formatCurrency(metrics.remainingBalance, currency),
              label,
              minPayment: formatCurrency(debt.minimumPayment, currency),
            });
          }

          if (metrics.isPaidOff) {
            emitFinancialEvent("debt:completed", debt.id, debt.name, undefined, {});
          }

          if (prefs.debtReminders && prefs.goalMilestoneAlerts) {
            const milestones = [25, 50, 75, 90];
            for (const m of milestones) {
              if (metrics.percentagePaid >= m) {
                emitFinancialEvent("debt:milestone", `${debt.id}-${m}`, debt.name, undefined, { pct: String(m) });
              }
            }
          }
        } catch { /* noop */ }
      }
    }

    if (prefs.largeTransactionAlerts) {
      for (const tx of transactions) {
        try {
          if (seenTransactions.current.has(tx.id)) continue;
          seenTransactions.current.add(tx.id);

          if (tx.type === "expense" && tx.amount >= LARGE_EXPENSE_THRESHOLD) {
            emitFinancialEvent("large:expense", tx.id, tx.description, tx.amount, {
              category: tx.category,
              description: tx.description,
              amount: formatCurrency(tx.amount, currency),
            });
          }
          if (tx.type === "income" && tx.amount >= LARGE_INCOME_THRESHOLD) {
            emitFinancialEvent("large:income", tx.id, tx.description, tx.amount, {
              category: tx.category,
              description: tx.description,
              amount: formatCurrency(tx.amount, currency),
            });
          }
          if (tx.type === "transfer") {
            emitFinancialEvent("transfer:completed", tx.id, undefined, tx.amount, {
              fromAccount: tx.fromAccount ?? "?",
              toAccount: tx.toAccount ?? "?",
              amount: formatCurrency(tx.amount, currency),
            });
          }
        } catch { /* noop */ }
      }
    }

    if (prefs.accountAlerts) {
      for (const account of accounts) {
        try {
          const bal = computeAccountBalance(account, transactions);
          const prevBal = prevAccountBalance.get(account.id) ?? bal;
          prevAccountBalance.set(account.id, bal);

          if (bal < 0 && prevBal >= 0) {
            emitFinancialEvent("account:negative-balance", account.id, account.name, bal, {
              balance: formatCurrency(bal, currency),
            });
          }

          if (bal > 0 && bal < LOW_BALANCE_THRESHOLD && prevBal >= LOW_BALANCE_THRESHOLD) {
            emitFinancialEvent("account:low-balance", account.id, account.name, bal, {
              balance: formatCurrency(bal, currency),
            });
          }
        } catch { /* noop */ }
      }
    }
  }, [budgets, goals, debts, transactions, accounts]);
}
