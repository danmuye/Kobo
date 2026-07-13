import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira, formatPercent } from "@/lib/format";
import type { BudgetTrend } from "@/store/finance";
import type { BudgetHistoryEntry } from "@/types";

interface BudgetComparisonProps {
  /** Current percentage spent. */
  currentPct: number;
  /** Previous period percentage spent. */
  previousPct: number;
  /** Trend direction. */
  trend: BudgetTrend;
  /** Previous period entry (for displaying period label and amounts). */
  previousPeriod?: BudgetHistoryEntry;
  /** If true, renders in a compact inline layout. Default false. */
  compact?: boolean;
}

const trendConfig = {
  improvement: {
    icon: ArrowDown,
    label: "Improved",
    color: "text-success",
    bg: "bg-success/10",
  },
  decline: {
    icon: ArrowUp,
    label: "Declined",
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  stable: {
    icon: Minus,
    label: "Stable",
    color: "text-muted-foreground",
    bg: "bg-muted/30",
  },
};

/**
 * Displays a historical comparison for a budget:
 * - Trend icon (down=improvement, up=decline, minus=stable)
 * - Previous period percentage vs current
 * - Previous period spent/amount breakdown
 */
export function BudgetComparison({
  currentPct,
  previousPct,
  trend,
  previousPeriod,
  compact = false,
}: BudgetComparisonProps) {
  const cfg = trendConfig[trend];
  const Icon = cfg.icon;
  const diff = currentPct - previousPct;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <span className={cn("inline-flex items-center gap-0.5 font-medium", cfg.color)}>
          <Icon className="h-3 w-3" />
          {cfg.label}
        </span>
        {previousPeriod && (
          <span className="text-muted-foreground">
            ({formatNaira(previousPeriod.spent)})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border/70 p-3 text-xs", cfg.bg)}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <Icon className={cn("h-4 w-4", cfg.color)} />
          {cfg.label}
        </span>
        <span className={cn("font-semibold", cfg.color)}>
          {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
        </span>
      </div>

      {previousPeriod && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Previous ({previousPeriod.periodKey})</span>
            <span>{formatPercent(previousPct)} used</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Spent</span>
            <span>{formatNaira(previousPeriod.spent)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Budget</span>
            <span>{formatNaira(previousPeriod.amount)}</span>
          </div>
        </div>
      )}

      {!previousPeriod && (
        <p className="mt-1 text-muted-foreground">No previous period data</p>
      )}
    </div>
  );
}