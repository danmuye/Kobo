import { memo } from "react";
import { motion } from "framer-motion";
import { CalendarClock, TrendingUp, AlertTriangle, Wallet, PiggyBank, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import type { Budget } from "@/types";
import { getBudgetInsights, getBudgetAvailableToSpend, type BudgetInsights, type BudgetAvailableToSpend, getBudgetStatus } from "@/services/budget-matching";
import type { Transaction } from "@/types";

interface BudgetInsightsPanelProps {
  budget: Budget;
  transactions: Transaction[];
  compact?: boolean;
}

function InsightCard({
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
        "rounded-lg border p-3 transition-colors",
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

export const BudgetInsightsPanel = memo(function BudgetInsightsPanel({ budget, transactions, compact = false }: BudgetInsightsPanelProps) {
  const insights = getBudgetInsights(budget, transactions);
  const ats = getBudgetAvailableToSpend(budget, transactions);
  const status = getBudgetStatus(
    transactions.length > 0
      ? (transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0) / budget.amount) * 100
      : 0,
  );

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <InsightCard icon={CalendarClock} label="Days Left" value={`${insights.daysRemaining}`} subtext={insights.daysRemaining === 1 ? "1 day" : `${insights.daysRemaining} days`} delay={0} />
        <InsightCard icon={TrendingUp} label="Daily Avg" value={formatNaira(insights.averageDailySpend)} delay={0.05} />
        <InsightCard icon={Wallet} label="Projected" value={formatNaira(insights.projectedEndSpend)} tone={insights.isOverBudgetForecast ? "destructive" : "default"} delay={0.1} />
        <InsightCard icon={Gauge} label="Daily Allow." value={formatNaira(insights.dailyAllowance)} tone={insights.dailyAllowance <= 0 ? "destructive" : "default"} delay={0.15} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Insights & Forecast</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <InsightCard
          icon={CalendarClock}
          label="Days Remaining"
          value={`${insights.daysRemaining}`}
          subtext={insights.daysRemaining === 0 ? "Period ended" : `Budget ends ${insights.daysRemaining === 1 ? "tomorrow" : `in ${insights.daysRemaining} days`}`}
          tone={insights.daysRemaining <= 3 ? "warning" : "default"}
          delay={0}
        />
        <InsightCard
          icon={TrendingUp}
          label="Average Daily Spend"
          value={formatNaira(insights.averageDailySpend)}
          delay={0.05}
        />
        <InsightCard
          icon={Wallet}
          label="Projected End-of-Period"
          value={formatNaira(insights.projectedEndSpend)}
          tone={insights.isOverBudgetForecast ? "destructive" : "default"}
          subtext={insights.isOverBudgetForecast ? "Forecast to exceed budget" : "On track to stay within budget"}
          delay={0.1}
        />
        <InsightCard
          icon={PiggyBank}
          label="Projected Remaining"
          value={formatNaira(insights.projectedRemaining)}
          tone={insights.projectedRemaining < 0 ? "destructive" : "success"}
          delay={0.15}
        />
        <InsightCard
          icon={AlertTriangle}
          label="Over Budget Forecast"
          value={insights.isOverBudgetForecast ? "At Risk" : "Safe"}
          tone={insights.isOverBudgetForecast ? "destructive" : "success"}
          delay={0.2}
        />
        <InsightCard
          icon={Gauge}
          label="Daily Allowance"
          value={formatNaira(insights.dailyAllowance)}
          tone={insights.dailyAllowance <= 0 ? "destructive" : insights.dailyAllowance < insights.averageDailySpend ? "warning" : "success"}
          subtext={insights.dailyAllowance <= 0 ? "No budget left" : "Per day for the rest of the period"}
          delay={0.25}
        />
      </div>

      {ats.pace !== "on-track" && (
        <div className={cn(
          "rounded-lg px-3 py-2 text-xs font-medium",
          ats.pace === "ahead" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
        )}>
          {ats.pace === "ahead"
            ? "You're ahead of budget — spending less than planned."
            : "You're behind budget — spending more than planned."}
        </div>
      )}
    </div>
  );
});
