import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";

type BudgetStatus = "healthy" | "warning" | "completed" | "exceeded";

interface CompactBudgetCardProps {
  name: string;
  spent: number;
  budget: number;
  status: BudgetStatus;
  onClick?: () => void;
}

const statusConfig: Record<BudgetStatus, { bar: string; text: string; label: string }> = {
  healthy: { bar: "bg-success", text: "text-success", label: "On track" },
  warning: { bar: "bg-warning", text: "text-warning", label: "Near limit" },
  completed: { bar: "bg-success", text: "text-success", label: "Completed" },
  exceeded: { bar: "bg-destructive", text: "text-destructive", label: "Exceeded" },
};

export const CompactBudgetCard = memo(function CompactBudgetCard({
  name,
  spent,
  budget,
  status,
  onClick,
}: CompactBudgetCardProps) {
  const cfg = statusConfig[status];
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = budget - spent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      className={cn(
        "rounded-lg border border-border/70 bg-card p-3.5 cursor-default transition-all",
        onClick && "cursor-pointer hover:border-border hover:shadow-sm",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium truncate text-foreground">{name}</span>
        <span className={cn("text-xs font-semibold tabular-nums", cfg.text)}>{cfg.label}</span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("h-full rounded-full", cfg.bar)}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          <span className="tabular-nums">{formatNaira(spent, { compact: true })}</span>
          <span className="text-muted-foreground/60 mx-1">/</span>
          <span className="tabular-nums">{formatNaira(budget, { compact: true })}</span>
        </span>
        <span className={cn(
          "tabular-nums font-medium",
          remaining < 0 ? "text-destructive" : "text-muted-foreground",
        )}>
          {remaining >= 0
            ? `${formatNaira(remaining, { compact: true })} left`
            : `${formatNaira(Math.abs(remaining), { compact: true })} over`}
        </span>
      </div>
    </motion.div>
  );
});
