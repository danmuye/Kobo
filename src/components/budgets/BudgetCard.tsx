import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Utensils, Bus, Home, Zap, Play, ShoppingBag, Heart, Users, GraduationCap, Stethoscope, type LucideIcon,
  MoreVertical, Eye, Pencil, Trash2, TrendingUp, CalendarClock, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import type { Budget } from "@/types";
import { getBudgetStatus, getBudgetCategories, getBudgetInsights, type BudgetMetrics, type BudgetStatusInfo } from "@/services/budget-matching";
import { BudgetInsightsPanel } from "./BudgetInsightsPanel";
import { useFinanceStore } from "@/store/finance";

const iconMap: Record<string, LucideIcon> = {
  food: Utensils, transport: Bus, home: Home, bolt: Zap, play: Play,
  bag: ShoppingBag, heart: Heart, users: Users, education: GraduationCap, health: Stethoscope,
};

function getBarColor(tone: "success" | "warning" | "destructive") {
  if (tone === "destructive") return "bg-destructive";
  if (tone === "warning") return "bg-warning";
  return "bg-success";
}

interface BudgetCardProps {
  budget: Budget;
  metrics: BudgetMetrics;
  onView?: (b: Budget) => void;
  onEdit?: (b: Budget) => void;
  onDelete?: (b: Budget) => void;
}

export function BudgetCard({ budget, metrics, onView, onEdit, onDelete }: BudgetCardProps) {
  const [showInsights, setShowInsights] = useState(false);
  const transactions = useFinanceStore((s) => s.transactions);
  const Icon = iconMap[budget.icon] ?? Utensils;
  const pct = metrics.percentage;
  const remaining = metrics.remaining;
  const overspent = metrics.spent - budget.amount;
  const status: BudgetStatusInfo = getBudgetStatus(pct);
  const exceeded = pct > 100;
  const barWidth = Math.min(pct, 100);
  const insights = getBudgetInsights(budget, transactions);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-elegant hover:shadow-elevated transition-all",
        exceeded ? "border-destructive/40" : "border-border",
      )}
    >
      {exceeded && <div className="absolute inset-x-0 top-0 h-1 bg-destructive" aria-hidden />}

      <div className="flex items-start gap-4">
        <div className={cn(
          "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
          exceeded ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
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
                status.tone === "destructive" && "bg-destructive/15 text-destructive hover:bg-destructive/15",
              )}
              variant="secondary"
            >
              {status.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Actions">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onView?.(budget)}>
                  <Eye className="h-4 w-4 mr-2" /> View Transactions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowInsights((v) => !v)}>
                  <TrendingUp className="h-4 w-4 mr-2" /> {showInsights ? "Hide" : "Show"} Insights
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(budget)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit Budget
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(budget)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Budget
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">
            {budget.period} &bull; {getBudgetCategories(budget).join(", ") || "No categories"}
            {insights.daysRemaining > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground/70">
                <CalendarClock className="h-3 w-3" />
                {insights.daysRemaining} day{insights.daysRemaining !== 1 ? "s" : ""} left
              </span>
            )}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              <BudgetInsightsPanel budget={budget} transactions={transactions} compact />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <motion.span
            key={`spent-${metrics.spent}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-lg font-bold"
          >
            {formatNaira(metrics.spent)}
          </motion.span>
          <span className="text-sm font-medium text-muted-foreground">{formatNaira(budget.amount)}</span>
        </div>

        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct.toFixed(1)}% of budget used`}>
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
          <motion.span
            key={`remaining-${metrics.remaining}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("font-medium", remaining < 0 ? "text-destructive" : "text-muted-foreground")}
          >
            {exceeded ? `${formatNaira(overspent)} over` : `${formatNaira(remaining)} left`}
          </motion.span>
        </div>

        <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Spent</span>
            <span className={cn("font-semibold", exceeded ? "text-destructive" : "text-foreground")}>{formatNaira(metrics.spent)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Transactions</span>
            <span className="font-semibold">{metrics.transactionCount}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Daily Avg</span>
            <span className="font-semibold">{formatNaira(insights.averageDailySpend)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className={cn("font-semibold", exceeded ? "text-destructive" : status.tone === "warning" ? "text-warning" : "text-success")}>{status.label}</span>
          </div>
        </div>

        <button
          onClick={() => setShowInsights((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/70 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition"
          aria-expanded={showInsights}
          aria-label={showInsights ? "Hide insights" : "Show insights"}
        >
          <Info className="h-3.5 w-3.5" />
          {showInsights ? "Hide" : "Show"} insights &amp; forecast
        </button>
      </div>
    </motion.div>
  );
}
