import { memo } from "react";
import { motion } from "framer-motion";
import {
  Utensils, Bus, Home, Zap, Play, ShoppingBag, Heart, Users, GraduationCap, Stethoscope,
  type LucideIcon, CalendarClock, TrendingDown, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { getBudgetStatus, getBudgetCategories, type BudgetMetrics, type BudgetStatusInfo } from "@/services/budget-matching";
import type { Budget } from "@/types";

const iconMap: Record<string, LucideIcon> = {
  food: Utensils, transport: Bus, home: Home, bolt: Zap, play: Play,
  bag: ShoppingBag, heart: Heart, users: Users, education: GraduationCap, health: Stethoscope,
};

interface DashboardBudgetCardProps {
  budget: Budget;
  metrics: BudgetMetrics;
  daysRemaining: number;
  projectedEndSpend: number;
  averageDailySpend: number;
  isOverBudgetForecast: boolean;
  onClick?: () => void;
}

export const DashboardBudgetCard = memo(function DashboardBudgetCard({
  budget,
  metrics,
  daysRemaining,
  projectedEndSpend,
  averageDailySpend,
  isOverBudgetForecast,
  onClick,
}: DashboardBudgetCardProps) {
  const Icon = iconMap[budget.icon] ?? Utensils;
  const status: BudgetStatusInfo = getBudgetStatus(metrics.percentage);
  const pct = metrics.percentage;
  const barWidth = Math.min(pct, 100);
  const exceeded = pct > 100;
  const remaining = metrics.remaining;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      className={cn(
        "rounded-[20px] border bg-card p-4 cursor-default transition-all shadow-sm hover:shadow-md",
        onClick && "cursor-pointer",
        exceeded ? "border-destructive/40" : "border-border",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          exceeded ? "bg-destructive/10 text-destructive" : status.tone === "warning" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary",
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display font-semibold text-sm truncate">{budget.name}</h4>
            <span className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              status.tone === "success" && "bg-success/15 text-success",
              status.tone === "warning" && "bg-warning/15 text-warning",
              status.tone === "destructive" && "bg-destructive/15 text-destructive",
            )}>
              {status.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground capitalize mt-0.5 truncate">
            {budget.period} &middot; {getBudgetCategories(budget).slice(0, 2).join(", ") || "General"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <span className="text-xs text-muted-foreground">Spent</span>
          <motion.p
            key={`spent-${metrics.spent}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-lg font-bold text-foreground"
          >
            {formatNaira(metrics.spent, { compact: true })}
          </motion.p>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">Remaining</span>
          <p className={cn(
            "font-display text-base font-semibold",
            remaining < 0 ? "text-destructive" : "text-foreground",
          )}>
            {remaining >= 0
              ? formatNaira(remaining, { compact: true })
              : `-${formatNaira(Math.abs(remaining), { compact: true })}`}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              status.tone === "destructive" && "bg-destructive",
              status.tone === "warning" && "bg-warning",
              status.tone === "success" && "bg-success",
            )}
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-xs">
          <span className={cn("font-medium", exceeded ? "text-destructive" : "text-muted-foreground")}>
            {pct.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">
            {formatNaira(budget.amount, { compact: true })} budget
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-border/50 grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarClock className="h-3 w-3 shrink-0" />
          <span>
            {daysRemaining > 0
              ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`
              : "Period ended"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {isOverBudgetForecast && daysRemaining > 0 ? (
            <>
              <TrendingUp className="h-3 w-3 shrink-0 text-destructive" />
              <span className="text-destructive">May exceed</span>
            </>
          ) : daysRemaining > 0 ? (
            <>
              <TrendingDown className="h-3 w-3 shrink-0 text-success" />
              <span className="text-success">On track</span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span>Avg <span className="tabular-nums">{formatNaira(averageDailySpend, { compact: true })}</span>/day</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span>Proj. <span className={cn("tabular-nums", isOverBudgetForecast ? "text-destructive font-medium" : "")}>{formatNaira(projectedEndSpend, { compact: true })}</span></span>
        </div>
      </div>
    </motion.div>
  );
});
