import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";

interface CompactTransactionItemProps {
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  timestamp: string;
  onClick?: () => void;
}

export const CompactTransactionItem = memo(function CompactTransactionItem({
  description,
  category,
  amount,
  type,
  timestamp,
  onClick,
}: CompactTransactionItemProps) {
  const isIncome = type === "income";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      className={cn(
        "flex items-center gap-3 py-2.5 px-1 first:pt-0 last:pb-0 border-b border-border/50 last:border-b-0 transition-all",
        onClick && "cursor-pointer hover:bg-muted/30 rounded-md",
      )}
    >
      <div className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
        isIncome ? "bg-success/10" : "bg-destructive/10",
      )}>
        {isIncome ? (
          <ArrowUpRight className="h-4 w-4 text-success" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-destructive" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{description}</p>
        <p className="text-xs text-muted-foreground hidden sm:block">{category}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className={cn(
          "text-sm font-semibold tabular-nums",
          isIncome ? "text-success" : "text-foreground",
        )}>
          {isIncome ? "+" : "−"}{formatNaira(amount, { compact: amount > 999_999 })}
        </p>
        <p className="text-[11px] text-muted-foreground/60">{timestamp}</p>
      </div>
    </motion.div>
  );
});
