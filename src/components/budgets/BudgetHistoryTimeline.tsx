import { motion } from "framer-motion";
import { History, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira, formatDate } from "@/lib/format";
import { useFinanceStore } from "@/store/finance";
import type { Budget, BudgetHistoryEntry } from "@/types";

interface BudgetHistoryTimelineProps {
  budget: Budget;
}

function getTrendIcon(pct: number) {
  if (pct > 100) return TrendingUp;
  if (pct > 80) return TrendingUp;
  return TrendingDown;
}

function getTrendColor(pct: number) {
  if (pct > 100) return "text-destructive";
  if (pct > 80) return "text-warning";
  return "text-success";
}

export function BudgetHistoryTimeline({ budget }: BudgetHistoryTimelineProps) {
  const history = useFinanceStore((state) =>
    state.budgetHistory.filter((h) => h.budgetId === budget.id)
  );

  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
        <History className="h-5 w-5 mx-auto mb-2 opacity-40" />
        <p>No historical data yet. History will appear when a budget period ends.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Budget History</h4>
        <span className="text-[11px] text-muted-foreground ml-auto">{history.length} period(s)</span>
      </div>

      <div className="space-y-2">
        {history.map((entry, i) => {
          const TrendIcon = getTrendIcon(entry.percentage);
          const trendColor = getTrendColor(entry.percentage);

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <TrendIcon className={cn("h-4 w-4", trendColor)} />
                    <span className="text-sm font-medium">{entry.budgetName}</span>
                    <span className={cn(
                      "text-xs font-semibold",
                      entry.percentage > 100 ? "text-destructive" : entry.percentage > 80 ? "text-warning" : "text-success",
                    )}>
                      {entry.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Budget: {formatNaira(entry.amount)}</span>
                    <span>Spent: {formatNaira(entry.spent)}</span>
                    <span>Remaining: {formatNaira(Math.max(entry.remaining, 0))}</span>
                    <span>{entry.transactionCount} txns</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(entry.archivedAt)}
                  </div>
                </div>
              </div>

              <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(entry.percentage, 100)}%` }}
                  transition={{ delay: i * 0.05 + 0.2, duration: 0.5, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    entry.percentage > 100 ? "bg-destructive" : entry.percentage > 80 ? "bg-warning" : "bg-success",
                  )}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
