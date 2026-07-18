import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira, formatPercent } from "@/lib/format";
import type { BudgetTrend } from "@/services/budget-matching";

interface BudgetComparisonProps {
  currentPct: number;
  previousPct: number;
  trend: BudgetTrend;
  previousSpent?: number;
  previousAmount?: number;
  previousPeriodKey?: string;
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

export function BudgetComparison({
  currentPct,
  previousPct,
  trend,
  previousSpent,
  previousAmount,
  previousPeriodKey,
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
        {previousSpent !== undefined && (
          <span className="text-muted-foreground">
            ({formatNaira(previousSpent)})
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

      {previousPeriodKey && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Previous ({previousPeriodKey})</span>
            <span>{formatPercent(previousPct)} used</span>
          </div>
          {previousSpent !== undefined && (
            <div className="flex justify-between text-muted-foreground">
              <span>Spent</span>
              <span>{formatNaira(previousSpent)}</span>
            </div>
          )}
          {previousAmount !== undefined && (
            <div className="flex justify-between text-muted-foreground">
              <span>Budget</span>
              <span>{formatNaira(previousAmount)}</span>
            </div>
          )}
        </div>
      )}

      {!previousPeriodKey && (
        <p className="mt-1 text-muted-foreground">No previous period data</p>
      )}
    </div>
  );
}
