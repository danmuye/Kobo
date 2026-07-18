import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, MoreVertical, Edit3, Trash2, Eye, BarChart3, Sparkles, Heart, Calendar, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatNaira, formatDate } from "@/lib/format";
import type { Debt } from "@/types";
import type { DebtMetrics, DebtStatusInfo } from "@/services/debt-matching";
import { getDebtStatus, debtStatusToneBg } from "@/services/debt-matching";
import { calculateDebtInsights } from "@/services/debt-insights";

interface DebtWithMetrics extends Debt {
  metrics: DebtMetrics;
}

interface DebtCardProps {
  debt: DebtWithMetrics;
  onEdit?: (d: Debt) => void;
  onDelete?: (d: Debt) => void;
  onMakePayment?: (d: Debt) => void;
  onViewTransactions?: (d: Debt) => void;
  onViewAnalytics?: (d: Debt) => void;
}

function ProgressBar({ pct, status }: { pct: number; status: DebtStatusInfo }) {
  const colorMap: Record<string, string> = {
    "paid-off": "bg-success",
    "on-track": "bg-blue-500",
    behind: "bg-amber-500",
    critical: "bg-destructive",
    overdue: "bg-destructive",
  };
  const barColor = colorMap[status.value] ?? "bg-primary";

  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct.toFixed(1)}% paid`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className={cn("h-full rounded-full relative overflow-hidden", barColor)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: "1000px 100%" }} />
      </motion.div>
    </div>
  );
}

export function DebtCard({ debt, onEdit, onDelete, onMakePayment, onViewTransactions, onViewAnalytics }: DebtCardProps) {
  const { metrics } = debt;
  const statusInfo: DebtStatusInfo = getDebtStatus(metrics.percentagePaid, metrics.isPaidOff, metrics.isOverdue);
  const { label, value } = statusInfo;

  const toneBgClass = debtStatusToneBg[value] ?? "bg-muted text-muted-foreground";
  const insights = calculateDebtInsights(debt, []);

  const payoffEstimate = insights.estimatedPayoffDate && !metrics.isPaidOff
    ? new Date(insights.estimatedPayoffDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  const healthColor = insights.debtHealthScore >= 70 ? "text-success" : insights.debtHealthScore >= 40 ? "text-amber-500" : "text-destructive";
  const healthFill = insights.debtHealthScore;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      role="article"
      aria-label={`${debt.name} — ${label}`}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-elegant hover:shadow-elevated transition-all",
        value === "overdue" ? "border-destructive/50" : value === "paid-off" ? "border-success/40" : "border-border",
      )}
    >
      {value === "overdue" && <div className="absolute inset-x-0 top-0 h-1 bg-destructive" aria-hidden />}
      {value === "paid-off" && <div className="absolute inset-x-0 top-0 h-1 bg-success" aria-hidden />}

      <AnimatePresence>
        {value === "paid-off" && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-3 right-12"
          >
            <Sparkles className="h-5 w-5 text-success animate-pulse" aria-label="Debt paid off" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-4">
        <div className={cn(
          "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
          value === "paid-off" ? "bg-success/10 text-success" :
          value === "overdue" ? "bg-destructive/10 text-destructive" :
          "bg-destructive/10 text-destructive",
        )}>
          <CreditCard className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display font-semibold truncate">{debt.name}</h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge className={cn("text-xs", toneBgClass)} variant="secondary">
                {label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Debt actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onMakePayment?.(debt)}>
                    <Plus className="h-4 w-4 mr-2" /> Make Payment
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit?.(debt)}>
                    <Edit3 className="h-4 w-4 mr-2" /> Edit Debt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewTransactions?.(debt)}>
                    <Eye className="h-4 w-4 mr-2" /> View Payments
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewAnalytics?.(debt)}>
                    <BarChart3 className="h-4 w-4 mr-2" /> View Analytics
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete?.(debt)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Debt
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {debt.lender} &bull; {debt.debtType} &bull; Due {formatDate(debt.dueDate)}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Paid off</span>
          <motion.span
            key={metrics.percentagePaid.toFixed(1)}
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {metrics.percentagePaid.toFixed(1)}%
          </motion.span>
        </div>

        <ProgressBar pct={metrics.percentagePaid} status={statusInfo} />

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
            <span className="text-muted-foreground block">Original</span>
            <motion.span
              key={debt.originalAmount}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-semibold text-sm"
            >
              {formatNaira(debt.originalAmount)}
            </motion.span>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
            <span className="text-muted-foreground block">Remaining</span>
            <motion.span
              key={metrics.remainingBalance}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn("font-semibold text-sm", metrics.isPaidOff ? "text-success" : metrics.isOverdue ? "text-destructive" : "text-foreground")}
            >
              {formatNaira(metrics.remainingBalance)}
            </motion.span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-border/70 bg-muted/30 p-2">
            <span className="text-muted-foreground block">Paid</span>
            <span className="font-semibold">{formatNaira(metrics.amountPaid)}</span>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/30 p-2">
            <span className="text-muted-foreground block">Monthly</span>
            <span className="font-semibold">{formatNaira(metrics.monthlyPaid)}</span>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/30 p-2">
            <span className="text-muted-foreground block">Min/mo</span>
            <span className="font-semibold">{formatNaira(debt.minimumPayment)}</span>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full gap-1.5"
          onClick={() => onMakePayment?.(debt)}
        >
          <Plus className="h-3.5 w-3.5" /> Make Payment
        </Button>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payments</span>
            <span className="font-semibold">{metrics.paymentCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Days until due</span>
            <span className={cn("font-semibold", metrics.isOverdue ? "text-destructive" : metrics.isPaidOff ? "text-success" : "text-foreground")}>
              {metrics.isPaidOff ? "Paid" : metrics.isOverdue ? "Overdue" : `${metrics.daysUntilDue}d`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Interest rate</span>
            <span className="font-semibold">{debt.interestRate}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Heart className="h-3 w-3" aria-hidden="true" /> Health
            </span>
            <span className={cn("font-semibold", healthColor)}>{insights.debtHealthScore}/100</span>
          </div>
          {payoffEstimate && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" /> Est. Payoff
              </span>
              <span className="font-semibold">{payoffEstimate}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
