import { memo } from "react";
import { motion } from "framer-motion";
import { Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardGoalCard } from "./DashboardGoalCard";
import { cn } from "@/lib/utils";
import type { Goal } from "@/types";
import type { GoalMetrics } from "@/store/finance";

interface SavingsGoalsSectionProps {
  goals: Array<Goal & { metrics: GoalMetrics }>;
}

export const SavingsGoalsSection = memo(function SavingsGoalsSection({
  goals,
}: SavingsGoalsSectionProps) {
  const topGoals = goals.slice(0, 3);

  return (
    <div className="rounded-[20px] border border-border bg-card p-4 md:p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">
            Savings Goals
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track progress toward your financial goals
          </p>
        </div>
        <Link
          to="/goals"
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
      {topGoals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topGoals.map((g, idx) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.25 }}
            >
              <DashboardGoalCard goal={g} metrics={g.metrics} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-[20px] bg-muted/50 mb-3">
            <Target className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No savings goals yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
            Create a goal to start tracking your savings
          </p>
        </div>
      )}
    </div>
  );
});
