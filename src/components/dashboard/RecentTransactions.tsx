import { memo } from "react";
import { motion } from "framer-motion";
import { ReceiptText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Transaction } from "@/types";
import { TransactionRow } from "./TransactionRow";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

export const RecentTransactions = memo(function RecentTransactions({
  transactions,
}: RecentTransactionsProps) {
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="rounded-[20px] border border-border bg-card p-4 md:p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">
            Recent Transactions
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your latest financial activity
          </p>
        </div>
        <Link
          to="/transactions"
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            "text-muted-foreground hover:text-foreground",
            "transition-colors shrink-0 mt-0.5",
          )}
        >
          View All
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Body */}
      {recentTransactions.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="divide-y divide-border/50"
        >
          {recentTransactions.map((t) => (
            <TransactionRow key={t.id} transaction={t} />
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-[20px] bg-muted/50 mb-3">
            <ReceiptText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No transactions yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
            Add your first transaction to see it here
          </p>
        </div>
      )}
    </div>
  );
});
