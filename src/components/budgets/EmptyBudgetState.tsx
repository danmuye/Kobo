import { memo } from "react";
import { motion } from "framer-motion";
import { PiggyBank, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyBudgetStateProps {
  onCreateNew: () => void;
}

export const EmptyBudgetState = memo(function EmptyBudgetState({ onCreateNew }: EmptyBudgetStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16 px-4"
      role="status"
      aria-label="No budgets found"
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 mb-4">
        <PiggyBank className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">No budgets yet</h2>
      <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
        Create your first budget to start tracking your spending and reaching your financial goals.
      </p>
      <Button onClick={onCreateNew} className="mt-6 gap-1.5">
        <Plus className="h-4 w-4" /> Create your first budget
      </Button>
    </motion.div>
  );
});
