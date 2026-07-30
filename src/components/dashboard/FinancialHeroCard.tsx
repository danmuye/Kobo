import { memo, useId } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, Plus, ArrowRightLeft, PieChart, Target } from "lucide-react";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { QuickActionCard } from "./QuickActionCard";
import { AnimatedNumber } from "./AnimatedNumber";

interface FinancialHeroCardProps {
  totalBalance: number;
  monthlyChange: number;
  availableBalance: number;
  income: number;
  expenses: number;
  savings: number;
  sparklineData: number[];
  onAddTransaction: () => void;
  onTransfer: () => void;
  onCreateBudget: () => void;
  onCreateGoal: () => void;
}

export const FinancialHeroCard = memo(function FinancialHeroCard({
  totalBalance,
  monthlyChange,
  availableBalance,
  income,
  expenses,
  savings,
  sparklineData,
  onAddTransaction,
  onTransfer,
  onCreateBudget,
  onCreateGoal,
}: FinancialHeroCardProps) {
  const gradientId = useId();
  const isPositive = monthlyChange >= 0;
  const chartData = sparklineData.map((y, x) => ({ x, y }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Balance
          </p>
          <p className="mt-2 font-display text-4xl md:text-5xl font-bold tracking-tight tabular-nums text-foreground">
            <AnimatedNumber value={totalBalance} format={formatNaira} />
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-sm font-medium",
                isPositive ? "text-success" : "text-destructive",
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span className="tabular-nums">
                {Math.abs(monthlyChange).toFixed(1)}%
              </span>
            </span>
            <span className="text-sm text-muted-foreground">vs last month</span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Available:{" "}
            <span className="tabular-nums font-medium text-foreground">
              {formatNaira(availableBalance)}
            </span>
          </p>
        </div>
        {chartData.length > 0 && (
          <div className="h-16 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(159 64% 45%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(159 64% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="y"
                  stroke="hsl(159 64% 45%)"
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="mt-1 font-display text-base font-semibold tabular-nums text-success">
            {formatNaira(income, { compact: true })}
          </p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="mt-1 font-display text-base font-semibold tabular-nums text-destructive">
            {formatNaira(expenses, { compact: true })}
          </p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Savings</p>
          <p className="mt-1 font-display text-base font-semibold tabular-nums text-primary">
            {formatNaira(savings, { compact: true })}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <QuickActionCard icon={Plus} label="Transaction" onClick={onAddTransaction} variant="primary" />
        <QuickActionCard icon={ArrowRightLeft} label="Transfer" onClick={onTransfer} />
        <QuickActionCard icon={PieChart} label="Budget" onClick={onCreateBudget} />
        <QuickActionCard icon={Target} label="Goal" onClick={onCreateGoal} />
      </div>
    </motion.div>
  );
});
