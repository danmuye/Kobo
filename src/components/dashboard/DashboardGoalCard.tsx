import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Target, Shield, Plane, Laptop, Home, PiggyBank, Heart, Star, BookOpen, Gift, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "./ProgressRing";
import { cn } from "@/lib/utils";
import { formatNaira, formatDate } from "@/lib/format";
import { getGoalStatus, type GoalMetrics } from "@/store/finance";
import type { Goal } from "@/types";

const iconMap: Record<string, LucideIcon> = {
  shield: Shield,
  plane: Plane,
  laptop: Laptop,
  home: Home,
  target: Target,
  "piggy-bank": PiggyBank,
  heart: Heart,
  star: Star,
  book: BookOpen,
  gift: Gift,
};

interface DashboardGoalCardProps {
  goal: Goal;
  metrics: GoalMetrics;
}

const statusVariants: Record<string, { bg: string; text: string; border: string }> = {
  completed: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/30" },
  exceeded: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/30" },
  expired: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30" },
  behind: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30" },
  "on-track": { bg: "bg-primary/10", text: "text-primary", border: "border-border" },
};

export const DashboardGoalCard = memo(function DashboardGoalCard({
  goal,
  metrics,
}: DashboardGoalCardProps) {
  const Icon = iconMap[goal.icon] ?? Target;
  const statusInfo = useMemo(
    () => getGoalStatus(metrics.percentage, metrics.isCompleted, metrics.isExpired),
    [metrics.percentage, metrics.isCompleted, metrics.isExpired],
  );
  const { label, value } = statusInfo;
  const variant = statusVariants[value] ?? statusVariants["on-track"];

  const progressColor = value === "completed" || value === "exceeded"
    ? "hsl(271 76% 53%)"
    : value === "expired"
      ? "hsl(var(--destructive))"
      : value === "behind"
        ? "hsl(var(--warning))"
        : goal.color || "hsl(var(--primary))";

  const isCompleted = metrics.isCompleted;
  const isExpired = metrics.isExpired;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        "rounded-[20px] border bg-card p-4 transition-all duration-200",
        "hover:shadow-md",
        variant.border,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {/* Top row: icon + name + status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
            variant.bg,
            variant.text,
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-foreground truncate">
              {goal.name}
            </h3>
            <p className="text-[12px] text-muted-foreground truncate">
              {goal.fundingType}
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={cn("text-[11px] shrink-0 font-medium border-0", variant.bg, variant.text)}
        >
          {label}
        </Badge>
      </div>

      {/* Progress ring + primary amount */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <ProgressRing percentage={metrics.percentage} size={64} strokeWidth={4} color={progressColor} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "text-sm font-bold tabular-nums",
              isCompleted ? "text-purple-500" : isExpired ? "text-destructive" : "text-foreground",
            )}>
              {Math.round(metrics.percentage)}%
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[24px] font-bold text-foreground tabular-nums leading-none">
            {formatNaira(metrics.saved, { compact: metrics.saved > 999_999 })}
          </p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            of <span className="font-semibold text-foreground">{formatNaira(goal.targetAmount, { compact: goal.targetAmount > 999_999 })}</span> target
          </p>
          {!isCompleted && !isExpired && metrics.daysRemaining > 0 && (
            <p className="text-[12px] text-muted-foreground mt-1">
              {metrics.daysRemaining} day{metrics.daysRemaining !== 1 ? "s" : ""} left
            </p>
          )}
          {isExpired && !isCompleted && (
            <p className="text-[12px] text-destructive mt-1">Target date passed</p>
          )}
          {isCompleted && metrics.completionDate && (
            <p className="text-[12px] text-success mt-1">Completed {formatDate(metrics.completionDate)}</p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-border/50" />

      {/* Footer metrics grid */}
      <div className="grid grid-cols-3 gap-2 text-[12px]">
        <div>
          <p className="text-muted-foreground">Remaining</p>
          <p className="font-semibold text-foreground tabular-nums mt-0.5">
            {formatNaira(metrics.remaining, { compact: metrics.remaining > 999_999 })}
          </p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Monthly</p>
          <p className="font-semibold text-foreground tabular-nums mt-0.5">
            {formatNaira(metrics.averageMonthlyRate, { compact: metrics.averageMonthlyRate > 999_999 })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground">Target</p>
          <p className="font-semibold text-foreground mt-0.5">
            {isCompleted ? "Done!" : formatDate(goal.targetDate)}
          </p>
        </div>
      </div>
    </motion.div>
  );
});
