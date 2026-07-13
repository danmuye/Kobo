import { motion } from "framer-motion";
import {
  Utensils, Bus, Home, Zap, Play, ShoppingBag, Heart, Users, GraduationCap, Stethoscope, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import type { Budget, BudgetHistoryEntry } from "@/types";
import { getBudgetRemaining, getBudgetPercentSpent, getBudgetOverspent, getBudgetStatus, type BudgetTrend } from "@/store/finance";
import { BudgetComparison } from "./BudgetComparison";

interface BudgetWithProgress extends Budget {
  progress: {
    pct: number;
    remaining: number;
    overspent: number;
    dailyAllowance: number;
    status: ReturnType<typeof getBudgetStatus>;
    previousPct: number;
    trend: BudgetTrend;
    previousPeriod?: BudgetHistoryEntry;
  };
}

const iconMap: Record<string, LucideIcon> = {
  food: Utensils,
  transport: Bus,
  home: Home,
  bolt: Zap,
  play: Play,
  bag: ShoppingBag,
  heart: Heart,
  users: Users,
  education: GraduationCap,
  health: Stethoscope,
};

function getBarColor(tone: "success" | "warning" | "destructive") {
  if (tone === "destructive") return "bg-destructive";
  if (tone === "warning") return "bg-warning";
  return "bg-success";
}

export function BudgetCard({ budget, onView }: { budget: Budget | BudgetWithProgress; onView?: (b: Budget) => void }) {
  const Icon = iconMap[budget.icon] ?? Utensils;
  const pct = getBudgetPercentSpent(budget);
  const remaining = getBudgetRemaining(budget);
  const overspent = getBudgetOverspent(budget);
  const status = getBudgetStatus(budget);
  const exceeded = pct > 100;
  const barWidth = Math.min(pct, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-elegant hover:shadow-elevated transition-all",
        exceeded ? "border-destructive/40" : "border-border"
      )}
    >
      {exceeded && (
        <div className="absolute inset-x-0 top-0 h-1 bg-destructive" aria-hidden />
      )}

      <div className="flex items-start gap-4">
        <div className={cn(
          "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
          exceeded ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display font-semibold truncate">{budget.name}</h3>
            <Badge
              className={cn(
                "shrink-0 text-xs",
                status.tone === "success" && "bg-success/15 text-success hover:bg-success/15",
                status.tone === "warning" && "bg-warning/15 text-warning hover:bg-warning/15",
                status.tone === "destructive" && "bg-destructive/15 text-destructive hover:bg-destructive/15"
              )}
              variant="secondary"
            >
              {status.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">{budget.period} • {budget.category}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Progress</span>
          <span>{pct > 100 ? "Over budget" : `${pct.toFixed(1)}% used`}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Spent</span>
          <span className="text-xs text-muted-foreground">Budget</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-display text-lg font-bold">{formatNaira(budget.spent)}</span>
          <span className="text-sm font-medium text-muted-foreground">{formatNaira(budget.amount)}</span>
        </div>

        {/* Animated progress bar */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className={cn("h-full rounded-full relative overflow-hidden", getBarColor(status.tone))}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: "1000px 100%" }} />
          </motion.div>
          {exceeded && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct - 100, 30)}%` }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="absolute right-0 top-0 h-full bg-destructive/40 border-l-2 border-destructive"
            />
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className={cn("font-semibold", exceeded ? "text-destructive" : "text-foreground")}>
            {pct.toFixed(1)}% used
          </span>
          <span className={cn("font-medium", remaining < 0 ? "text-destructive" : "text-muted-foreground")}>
            {exceeded ? `${formatNaira(overspent)} over` : `${formatNaira(remaining)} left`}
          </span>
        </div>

        <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Remaining balance</span>
            <span className={cn("font-semibold", exceeded ? "text-destructive" : "text-foreground")}>{formatNaira(Math.max(remaining, 0))}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className={cn("font-semibold", exceeded ? "text-destructive" : status.tone === "warning" ? "text-warning" : "text-success")}>{status.label}</span>
          </div>
          {"progress" in budget && budget.progress && (
            <div className="mt-2 border-t border-border/50 pt-2">
              <BudgetComparison
                currentPct={pct}
                previousPct={budget.progress.previousPct}
                trend={budget.progress.trend}
                previousPeriod={budget.progress.previousPeriod}
                compact
              />
            </div>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-4 w-full"
        onClick={() => onView?.(budget)}
      >
        View Details
      </Button>
    </motion.div>
  );
}
