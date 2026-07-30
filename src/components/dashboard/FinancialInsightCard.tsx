import { memo } from "react";
import { motion } from "framer-motion";
import { type LucideIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type InsightType = "positive" | "negative" | "info";

interface FinancialInsightCardProps {
  icon: LucideIcon;
  message: string;
  type: InsightType;
  action?: { label: string; onClick: () => void };
}

const typeStyles: Record<InsightType, { dot: string; bg: string }> = {
  positive: { dot: "bg-success", bg: "bg-success/5 border-success/15" },
  negative: { dot: "bg-destructive", bg: "bg-destructive/5 border-destructive/15" },
  info: { dot: "bg-info", bg: "bg-info/5 border-info/15" },
};

export const FinancialInsightCard = memo(function FinancialInsightCard({
  icon: Icon,
  message,
  type,
  action,
}: FinancialInsightCardProps) {
  const style = typeStyles[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -2 }}
      className={cn("rounded-lg border p-3.5 hover:shadow-sm transition-all", style.bg)}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background shadow-sm">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} />
            <p className="text-sm text-foreground">{message}</p>
          </div>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {action.label}
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
