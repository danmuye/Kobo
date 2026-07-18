import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, ArrowUpRight, DollarSign, TrendingUp, PieChart, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira, formatDate } from "@/lib/format";
import type { Budget, Transaction } from "@/types";
import {
  getBudgetAnalytics,
  calculateBudgetMetrics,
  computeBudgetUtilization,
} from "@/services/budget-matching";

interface BudgetAnalyticsPanelProps {
  budget: Budget;
  transactions: Transaction[];
  allBudgets: Budget[];
  allTransactions: Transaction[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  tone,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext?: string;
  tone?: "success" | "warning" | "destructive" | "default";
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "rounded-lg border p-3",
        tone === "success" && "border-success/30 bg-success/5",
        tone === "warning" && "border-warning/30 bg-warning/5",
        tone === "destructive" && "border-destructive/30 bg-destructive/5",
        (!tone || tone === "default") && "border-border bg-card",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className={cn(
          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md",
          tone === "success" && "bg-success/10 text-success",
          tone === "warning" && "bg-warning/10 text-warning",
          tone === "destructive" && "bg-destructive/10 text-destructive",
          (!tone || tone === "default") && "bg-primary/10 text-primary",
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-0.5 font-display text-base font-bold truncate">{value}</p>
          {subtext && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{subtext}</p>}
        </div>
      </div>
    </motion.div>
  );
}

export function BudgetAnalyticsPanel({
  budget,
  transactions,
  allBudgets,
  allTransactions,
}: BudgetAnalyticsPanelProps) {
  const analytics = useMemo(
    () => getBudgetAnalytics(budget, transactions),
    [budget, transactions],
  );

  const metrics = useMemo(
    () => calculateBudgetMetrics(budget, transactions),
    [budget, transactions],
  );

  const utilization = useMemo(
    () => computeBudgetUtilization(allBudgets, allTransactions),
    [allBudgets, allTransactions],
  );

  const budgetUtilPct = utilization.utilization;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Analytics</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          icon={PieChart}
          label="Budget Utilization"
          value={`${budgetUtilPct.toFixed(1)}%`}
          tone={budgetUtilPct > 100 ? "destructive" : budgetUtilPct > 80 ? "warning" : "success"}
          subtext={`${formatNaira(utilization.totalSpent)} of ${formatNaira(utilization.totalBudgeted)}`}
          delay={0}
        />
        <StatCard
          icon={Wallet}
          label="Available to Spend"
          value={formatNaira(Math.max(0, budget.amount - metrics.spent))}
          tone={metrics.spent > budget.amount ? "destructive" : "success"}
          delay={0.05}
        />
        <StatCard
          icon={DollarSign}
          label="Average Transaction"
          value={formatNaira(analytics.averageTransaction)}
          subtext={metrics.transactionCount > 0 ? `Across ${metrics.transactionCount} transactions` : "No transactions yet"}
          delay={0.1}
        />
        {analytics.largestTransaction && (
          <StatCard
            icon={ArrowUpRight}
            label="Largest Transaction"
            value={formatNaira(analytics.largestTransaction.amount)}
            subtext={`${analytics.largestTransaction.description} — ${formatDate(analytics.largestTransaction.date)}`}
            delay={0.15}
          />
        )}
      </div>

      {analytics.topCategories.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Top Spending Categories</span>
          </div>
          <div className="space-y-2">
            {analytics.topCategories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{cat.name}</span>
                  <span className="text-muted-foreground">{formatNaira(cat.amount)} ({cat.pct.toFixed(1)}%)</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.pct}%` }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {analytics.dailyTrend.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Daily Spend Trend</span>
          </div>
          <div className="flex items-end gap-1 h-24">
            {analytics.dailyTrend.slice(-14).map((day, i) => {
              const maxAmount = Math.max(...analytics.dailyTrend.map((d) => d.amount), 1);
              const height = (day.amount / maxAmount) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1" title={`${day.date}: ${formatNaira(day.amount)}`}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.02, duration: 0.4, ease: "easeOut" }}
                    className="w-full rounded-t bg-primary/60 hover:bg-primary transition-colors cursor-pointer"
                    style={{ minHeight: height > 0 ? 2 : 0 }}
                  />
                  <span className="text-[8px] text-muted-foreground rotate-[-45deg] origin-left whitespace-nowrap">
                    {day.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
