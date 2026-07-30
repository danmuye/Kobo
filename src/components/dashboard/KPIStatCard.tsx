import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { AnimatedNumber } from "./AnimatedNumber";

const colorMap = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", icon: "bg-emerald-500/15 text-emerald-500" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-500", icon: "bg-blue-500/15 text-blue-500" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-500", icon: "bg-amber-500/15 text-amber-500" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500", icon: "bg-purple-500/15 text-purple-500" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-500", icon: "bg-rose-500/15 text-rose-500" },
};

interface KPIStatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  trend?: { direction: "up" | "down"; value: number };
  color?: keyof typeof colorMap;
  compact?: boolean;
  description?: string;
}

export const KPIStatCard = memo(function KPIStatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = "emerald",
  compact = false,
  description,
}: KPIStatCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={cn(
        "rounded-2xl border border-border bg-card shadow-sm transition-all",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={cn(
            "mt-1.5 font-display font-bold tracking-tight tabular-nums text-foreground",
            compact ? "text-xl" : "text-2xl",
          )}>
            <AnimatedNumber value={value} format={(v) => formatNaira(v, { compact: value > 999_999 })} />
          </p>
        </div>
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", c.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}

      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium",
            trend.direction === "up" ? "text-emerald-500" : "text-rose-500",
          )}>
            {trend.direction === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span className="tabular-nums">{Math.abs(trend.value).toFixed(1)}%</span>
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </motion.div>
  );
});
