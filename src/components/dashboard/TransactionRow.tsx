import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart, ShoppingBag, Car, Film, Zap, HeartPulse,
  GraduationCap, Briefcase, Home, Plane, Repeat,
  UtensilsCrossed, PiggyBank, CreditCard, CircleDollarSign,
  TrendingUp, StickyNote, type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNaira, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";
import { useTransactionModal } from "@/store/transaction-modal";

const categoryIcons: Record<string, LucideIcon> = {
  "Food & Dining": UtensilsCrossed,
  "Groceries": ShoppingCart,
  "Shopping": ShoppingBag,
  "Transportation": Car,
  "Transport": Car,
  "Entertainment": Film,
  "Bills & Utilities": Zap,
  "Utilities": Zap,
  "Health": HeartPulse,
  "Healthcare": HeartPulse,
  "Education": GraduationCap,
  "Salary": Briefcase,
  "Income": TrendingUp,
  "Rent": Home,
  "Housing": Home,
  "Travel": Plane,
  "Subscriptions": Repeat,
  "Investment": TrendingUp,
  "Savings": PiggyBank,
  "Debt": CreditCard,
  "Personal": CircleDollarSign,
  "General": CircleDollarSign,
  "Other": CircleDollarSign,
};

function getCategoryIcon(category: string): LucideIcon {
  return categoryIcons[category] ?? CircleDollarSign;
}

interface TransactionRowProps {
  transaction: Transaction;
}

export const TransactionRow = memo(function TransactionRow({
  transaction: t,
}: TransactionRowProps) {
  const openModal = useTransactionModal((s) => s.open);

  const handleClick = useCallback(() => {
    openModal("edit", t);
  }, [openModal, t]);

  const isIncome = t.type === "income";
  const isExpense = t.type === "expense";
  const isTransfer = t.type === "transfer";
  const isDebtExpense = !!t.debtId && isExpense;

  const CategoryIcon = getCategoryIcon(t.category);

  const iconStyle = isIncome
    ? "bg-success/10 text-success"
    : isTransfer
      ? "bg-primary/10 text-primary"
      : isDebtExpense
        ? "bg-warning/10 text-warning"
        : "bg-destructive/10 text-destructive";

  const amountColor = isIncome
    ? "text-success"
    : isTransfer
      ? "text-foreground"
      : isDebtExpense
        ? "text-warning"
        : "text-destructive";

  const amountPrefix = isIncome ? "+" : isExpense ? "−" : "";

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0 },
      }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "group flex items-start gap-2.5 py-2.5 px-2 -mx-2 rounded-xl",
        "cursor-pointer transition-all duration-200",
        "hover:bg-muted/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      {/* Category Icon */}
      <div
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
          iconStyle,
          "transition-transform duration-200 group-hover:scale-105",
        )}
      >
        <CategoryIcon className="h-4 w-4" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-foreground truncate">
            {t.description}
          </span>
          {t.merchant && (
            <span className="text-xs text-muted-foreground/70 shrink-0 hidden sm:inline">
              @{t.merchant}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
          <span>{t.category}</span>
          <span className="text-muted-foreground/20">·</span>
          <span className="whitespace-nowrap">{formatDate(t.date)}</span>
          {t.account && (
            <>
              <span className="text-muted-foreground/20">·</span>
              <span className="truncate max-w-[100px]">
                {isTransfer
                  ? `${t.fromAccount ?? ""} → ${t.toAccount ?? ""}`
                  : t.account}
              </span>
            </>
          )}
          {t.tags && t.tags.length > 0 && (
            <>
              <span className="text-muted-foreground/20">·</span>
              <div className="flex items-center gap-1">
                {t.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 leading-3 font-normal border-border/50 text-muted-foreground/70"
                  >
                    {tag}
                  </Badge>
                ))}
                {t.tags.length > 2 && (
                  <span className="text-[10px] text-muted-foreground/50">+{t.tags.length - 2}</span>
                )}
              </div>
            </>
          )}
          {t.notes && (
            <>
              <span className="text-muted-foreground/20">·</span>
              <StickyNote className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <p className={cn("text-base font-bold tabular-nums leading-none", amountColor)}>
          {amountPrefix}{formatNaira(t.amount)}
        </p>
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
          {isTransfer ? "Transfer" : isIncome ? "Income" : isDebtExpense ? "Debt Payment" : "Expense"}
        </p>
      </div>
    </motion.div>
  );
});
