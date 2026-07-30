import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricVariant = "default" | "positive" | "warning" | "critical";

interface SnapshotMetricProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { direction: "up" | "down" | "stable"; value: string };
  variant?: MetricVariant;
  description?: string;
}

const variantStyles: Record<MetricVariant, { badge: string; icon: string }> = {
  default: { badge: "bg-muted text-muted-foreground", icon: "bg-muted text-muted-foreground" },
  positive: { badge: "bg-success/10 text-success", icon: "bg-success/10 text-success" },
  warning: { badge: "bg-warning/10 text-warning", icon: "bg-warning/10 text-warning" },
  critical: { badge: "bg-destructive/10 text-destructive", icon: "bg-destructive/10 text-destructive" },
};

const badgeLabels: Record<MetricVariant, string> = {
  default: "",
  positive: "Healthy",
  warning: "Caution",
  critical: "Critical",
};

export const SnapshotMetric = memo(function SnapshotMetric({
  label,
  value,
  icon: Icon,
  trend,
  variant = "default",
  description,
}: SnapshotMetricProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="rounded-[20px] border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-foreground/10"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors", styles.icon)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted-foreground truncate">
            {label}
          </span>
        </div>
        {variant !== "default" && (
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0", styles.badge)}>
            {badgeLabels[variant]}
          </span>
        )}
      </div>

      <p className="text-[28px] font-bold leading-none tracking-tight tabular-nums text-foreground">
        {value}
      </p>

      {(trend || description) && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {trend && (
            <span className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
              trend.direction === "up" ? "text-success" : trend.direction === "down" ? "text-destructive" : "text-muted-foreground",
            )}>
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : trend.direction === "down" ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-xs text-muted-foreground/80">{description}</span>
          )}
        </div>
      )}
    </motion.div>
  );
});
