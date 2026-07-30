import { memo, useMemo, useId } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Plus, ArrowRightLeft, PieChart, Target, CreditCard,
  Wallet, PiggyBank, BarChart3, Minus, CircleDollarSign,
} from "lucide-react";
import { formatNaira, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";

interface MetricTrend {
  direction: "up" | "down";
  value: number;
}

interface Metric {
  icon: typeof TrendingUp;
  label: string;
  value: number;
  trend: MetricTrend;
  positive: boolean;
  format?: (v: number) => string;
}

interface BudgetHealthData {
  healthy: number;
  nearLimit: number;
  exceeded: number;
}

interface HeroFinancialOverviewProps {
  totalBalance: number;
  availableBalance: number;
  monthlyChange: number;
  netCashFlow: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  incomeTrend: MetricTrend;
  expenseTrend: MetricTrend;
  savingsTrend: MetricTrend;
  debtTotalRemaining: number;
  budgetHealth: BudgetHealthData;
  budgetCount: number;
  savingsRate: number;
  budgetUtilization: number;
  activeAccounts: number;
  sparklineData: number[];
  onAddTransaction: () => void;
  onTransfer: () => void;
  onCreateBudget: () => void;
  onCreateGoal: () => void;
  onRecordDebtPayment: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

function TrendBadge({ trend, positive }: { trend: MetricTrend; positive: boolean }) {
  const isGood = (trend.direction === "up") === positive;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        isGood ? "text-success" : "text-destructive",
      )}
    >
      {trend.direction === "up" ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {Math.abs(trend.value).toFixed(1)}%
    </span>
  );
}

function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  const Icon = metric.icon;
  const isUpGood = (metric.trend.direction === "up") === metric.positive;
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2 }}
      className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          metric.positive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
        <p className="font-semibold text-foreground tabular-nums">
          {metric.format ? metric.format(metric.value) : formatNaira(metric.value, { compact: metric.value > 999_999 })}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <TrendBadge trend={metric.trend} positive={metric.positive} />
        <div
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isUpGood ? "bg-success" : "bg-destructive",
          )}
        />
      </div>
    </motion.div>
  );
}

const quickActions = [
  { icon: Plus, label: "Add Transaction", key: "add", primary: true },
  { icon: ArrowRightLeft, label: "Transfer", key: "transfer", primary: false },
  { icon: PieChart, label: "Budget", key: "budget", primary: false },
  { icon: Target, label: "Savings Goal", key: "goal", primary: false },
  { icon: CreditCard, label: "Record Debt Payment", key: "debt", primary: false },
] as const;

export const HeroFinancialOverview = memo(function HeroFinancialOverview({
  totalBalance,
  availableBalance,
  monthlyChange,
  netCashFlow,
  monthlyIncome,
  monthlyExpenses,
  monthlySavings,
  incomeTrend,
  expenseTrend,
  savingsTrend,
  debtTotalRemaining,
  budgetHealth,
  budgetCount,
  savingsRate,
  budgetUtilization,
  activeAccounts,
  sparklineData,
  onAddTransaction,
  onTransfer,
  onCreateBudget,
  onCreateGoal,
  onRecordDebtPayment,
}: HeroFinancialOverviewProps) {
  const gradientId = useId();
  const chartData = useMemo(
    () => sparklineData.map((y, x) => ({ x, y })),
    [sparklineData],
  );
  const isPositive = monthlyChange >= 0;

  const actionHandlers: Record<string, () => void> = {
    add: onAddTransaction,
    transfer: onTransfer,
    budget: onCreateBudget,
    goal: onCreateGoal,
    debt: onRecordDebtPayment,
  };

  const metrics: Metric[] = useMemo(
    () => [
      { icon: TrendingUp, label: "Income", value: monthlyIncome, trend: incomeTrend, positive: true },
      { icon: TrendingDown, label: "Expenses", value: monthlyExpenses, trend: expenseTrend, positive: false },
      { icon: PiggyBank, label: "Savings", value: monthlySavings, trend: savingsTrend, positive: true },
      {
        icon: CreditCard,
        label: "Debt",
        value: debtTotalRemaining,
        trend: { direction: debtTotalRemaining > 0 ? "up" : "down", value: 0 },
        positive: false,
      },
      {
        icon: PieChart,
        label: "Budget Health",
        value: budgetHealth.healthy,
        trend: { direction: budgetCount > 0 && budgetHealth.healthy >= budgetCount / 2 ? "up" : "down", value: budgetCount > 0 ? (budgetHealth.healthy / budgetCount) * 100 : 0 },
        positive: true,
        format: (v) => `${Math.round(v)} ${budgetCount > 0 ? `/ ${budgetCount}` : ""}`,
      },
    ],
    [monthlyIncome, monthlyExpenses, monthlySavings, incomeTrend, expenseTrend, savingsTrend, debtTotalRemaining, budgetHealth, budgetCount],
  );

  const kpiRows = useMemo(
    () => [
      {
        icon: Wallet,
        label: "Net Worth",
        value: formatNaira(totalBalance, { compact: totalBalance > 999_999 }),
        trend: { direction: (isPositive ? "up" : "down") as "up" | "down", value: `${Math.abs(monthlyChange).toFixed(1)}%` },
      },
      {
        icon: PiggyBank,
        label: "Savings Rate",
        value: formatPercent(savingsRate),
        trend: { direction: savingsRate > 0 ? "up" : "stable" as const, value: `${Math.round(savingsRate)}%` },
      },
      {
        icon: CreditCard,
        label: "Total Outstanding Debt",
        value: formatNaira(debtTotalRemaining, { compact: debtTotalRemaining > 999_999 }),
        negative: debtTotalRemaining > 0,
      },
      {
        icon: BarChart3,
        label: "Budget Utilisation",
        value: budgetCount > 0 ? `${Math.round(budgetUtilization)}%` : "N/A",
      },
      {
        icon: CircleDollarSign,
        label: "Active Accounts",
        value: `${activeAccounts} active`,
      },
    ],
    [totalBalance, isPositive, monthlyChange, savingsRate, debtTotalRemaining, budgetUtilization, budgetCount, activeAccounts],
  );

  const trendDescription = useMemo(() => {
    const parts: string[] = [];
    if (incomeTrend.direction === "up") parts.push(`income up ${incomeTrend.value.toFixed(1)}%`);
    else if (incomeTrend.value !== 0) parts.push(`income down ${Math.abs(incomeTrend.value).toFixed(1)}%`);
    if (expenseTrend.direction === "down" && expenseTrend.value !== 0) parts.push(`spending down ${Math.abs(expenseTrend.value).toFixed(1)}%`);
    else if (expenseTrend.direction === "up" && expenseTrend.value !== 0) parts.push(`spending up ${expenseTrend.value.toFixed(1)}%`);
    if (parts.length === 0) return "No significant changes this month";
    return parts.join(" · ");
  }, [incomeTrend, expenseTrend]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-12 gap-4"
    >
      {/* ── Left Column ── */}
      <div className="lg:col-span-7 space-y-4">
        {/* Balance Card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          className="rounded-[20px] border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Total Balance
          </p>
          <p className="mt-2 font-display text-[40px] font-bold leading-none tracking-tight tabular-nums text-foreground lg:text-[44px]">
            <AnimatedNumber value={totalBalance} format={formatNaira} />
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-sm text-muted-foreground">
              Available:{" "}
              <span className="font-medium text-foreground/80 tabular-nums">
                {formatNaira(availableBalance)}
              </span>
            </span>
            <span className="h-3 w-px bg-border" />
            <span
              className={cn(
                "inline-flex items-center gap-1 text-sm font-medium tabular-nums",
                isPositive ? "text-success" : "text-destructive",
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {Math.abs(monthlyChange).toFixed(1)}% vs last month
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                netCashFlow >= 0
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {netCashFlow >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              Net Cash Flow: {formatNaira(Math.abs(netCashFlow), { compact: true })}
            </span>
            <span className="text-xs text-muted-foreground">{trendDescription}</span>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metrics.map((metric, i) => (
            <MetricCard key={metric.label} metric={metric} index={i} />
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center gap-2.5"
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.key}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={actionHandlers[action.key]}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9",
                  action.primary
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{action.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* ── Right Column ── */}
      <div className="lg:col-span-5">
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          className="rounded-[20px] border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md h-full"
        >
          {/* Sparkline */}
          {chartData.length > 0 && (
            <div className="h-14">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="y"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Financial Summary
          </p>

          <div className="mt-3 space-y-0">
            {kpiRows.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm text-muted-foreground truncate">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        "negative" in row && row.negative ? "text-destructive" : "text-foreground",
                      )}
                    >
                      {row.value}
                    </span>
                    {"trend" in row && row.trend && (
                      <span
                        className={cn(
                          "inline-flex items-center text-xs",
                          row.trend.direction === "up"
                            ? "text-success"
                            : row.trend.direction === "down"
                              ? "text-destructive"
                              : "text-muted-foreground",
                        )}
                      >
                        {row.trend.direction === "up" ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : row.trend.direction === "down" ? (
                          <ArrowDownRight className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        <span className="tabular-nums">{row.trend.value}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});
