import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatNaira, formatDate } from "@/lib/format";
import { ProgressRing } from "./ProgressRing";

interface CompactGoalCardProps {
  name: string;
  saved: number;
  target: number;
  targetDate: string;
  percentage: number;
  onClick?: () => void;
}

const goalColor = "hsl(var(--primary))";

export const CompactGoalCard = memo(function CompactGoalCard({
  name,
  saved,
  target,
  targetDate,
  percentage,
  onClick,
}: CompactGoalCardProps) {
  const completed = percentage >= 100;

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
        "rounded-lg border border-border/70 bg-card p-3.5 cursor-default transition-all flex items-center gap-3.5",
        onClick && "cursor-pointer hover:border-border hover:shadow-sm",
      )}
    >
      <ProgressRing percentage={percentage} size={44} strokeWidth={3.5} color={goalColor} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className="tabular-nums">{formatNaira(saved, { compact: true })}</span>
          <span className="text-muted-foreground/60 mx-1">/</span>
          <span className="tabular-nums">{formatNaira(target, { compact: true })}</span>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={cn(
          "text-xs font-semibold tabular-nums",
          completed ? "text-success" : "text-muted-foreground",
        )}>
          {completed ? "Done!" : `${Math.round(percentage)}%`}
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
          {completed ? "Completed" : formatDate(targetDate)}
        </p>
      </div>
    </motion.div>
  );
});
