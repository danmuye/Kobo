import { memo, useMemo, useId } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import {
  TrendingUp, TrendingDown, PiggyBank, CreditCard, PieChart,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MetricTrend {
  direction: "up" | "down";
  value: number;
}

interface BudgetHealthData {
  healthy: number;
  nearLimit: number;
  exceeded: number;
}

interface AnalyticsKPICardsProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  incomeTrend: MetricTrend;
  expenseTrend: MetricTrend;
  savingsTrend: MetricTrend;
  debtTotalRemaining: number;
  debtCount: number;
  budgetHealth: BudgetHealthData;
  budgetCount: number;
  monthlyChart: Array<{ income: number; expenses: number }>;
}

type BadgeVariant = "positive" | "negative" | "warning" | "neutral";

function CardSparkline({ data }: { data: number[] }) {
  const id = useId();
  const chartData = useMemo(
    () => data.map((y, x) => ({ x, y })),
    [data],
  );
  return (
    <div className="h-[26px] flex-1 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.12} />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="y"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1.5}
            strokeLinecap="round"
            fill={`url(#${id})`}
            dot={false}
            isAnimationActive={true}
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatusBadge({ text, variant }: { text: string; variant: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        variant === "positive" && "bg-success/10 text-success",
        variant === "negative" && "bg-destructive/10 text-destructive",
        variant === "warning" && "bg-warning/10 text-warning",
        variant === "neutral" && "bg-muted text-muted-foreground",
      )}
    >
      {text}
    </span>
  );
}

function TrendPill({ value, up, positive }: { value: number; up: boolean; positive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums shrink-0",
        positive ? "text-success" : "text-destructive",
      )}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {value.toFixed(1)}%
    </span>
  );
}

export const AnalyticsKPICards = memo(function AnalyticsKPICards({
  monthlyIncome,
  monthlyExpenses,
  monthlySavings,
  incomeTrend,
  expenseTrend,
  savingsTrend,
  debtTotalRemaining,
  debtCount,
  budgetHealth,
  budgetCount,
  monthlyChart,
}: AnalyticsKPICardsProps) {
  const cards = useMemo(() => {
    const incomeSparkline = monthlyChart.length > 1
      ? monthlyChart.map((m) => m.income)
      : [];
    const expenseSparkline = monthlyChart.length > 1
      ? monthlyChart.map((m) => m.expenses)
      : [];
    const savingsSparkline = monthlyChart.length > 1
      ? monthlyChart.map((m) => m.income - m.expenses)
      : [];

    const incomeIsUp = incomeTrend.direction === "up";
    const expenseIsDown = expenseTrend.direction === "down";
    const savingsIsUp = savingsTrend.direction === "up";

    let bhBadge: string;
    let bhVariant: BadgeVariant;
    if (budgetCount === 0) {
      bhBadge = "No budgets";
      bhVariant = "neutral";
    } else if (budgetHealth.healthy === budgetCount) {
      bhBadge = "On track";
      bhVariant = "positive";
    } else if (budgetHealth.exceeded > 0) {
      bhBadge = "At risk";
      bhVariant = "negative";
    } else {
      bhBadge = "Warning";
      bhVariant = "warning";
    }

    const hasDebt = debtTotalRemaining > 0;
    const debtText = debtCount === 0
      ? "No outstanding debts"
      : hasDebt
        ? `Across ${debtCount} ${debtCount === 1 ? "debt" : "debts"}`
        : "All debts cleared";

    const budgetText = budgetCount > 0
      ? `${budgetHealth.nearLimit} near limit \u00B7 ${budgetHealth.exceeded} exceeded`
      : "Create budgets to track spending";

    return [
      {
        id: "income",
        icon: TrendingUp,
        title: "Income",
        value: formatNaira(monthlyIncome, { compact: monthlyIncome > 999_999 }),
        trendValue: incomeTrend.value,
        trendUp: incomeIsUp,
        trendPositive: incomeIsUp,
        badge: incomeIsUp ? "Growing" : "Declining",
        badgeVariant: (incomeIsUp ? "positive" : "negative") as BadgeVariant,
        sparklineData: incomeSparkline,
        supportingText: "Total monthly income",
      },
      {
        id: "expenses",
        icon: TrendingDown,
        title: "Expenses",
        value: formatNaira(monthlyExpenses, { compact: monthlyExpenses > 999_999 }),
        trendValue: expenseTrend.value,
        trendUp: expenseIsDown,
        trendPositive: expenseIsDown,
        badge: expenseIsDown ? "Controlled" : "Rising",
        badgeVariant: (expenseIsDown ? "positive" : "negative") as BadgeVariant,
        sparklineData: expenseSparkline,
        supportingText: "Total monthly spending",
      },
      {
        id: "savings",
        icon: PiggyBank,
        title: "Savings",
        value: formatNaira(monthlySavings, { compact: monthlySavings > 999_999 }),
        trendValue: savingsTrend.value,
        trendUp: savingsIsUp,
        trendPositive: savingsIsUp,
        badge: savingsIsUp ? "Building" : "Depleting",
        badgeVariant: (savingsIsUp ? "positive" : "negative") as BadgeVariant,
        sparklineData: savingsSparkline,
        supportingText: "Net income saved",
      },
      {
        id: "debt",
        icon: CreditCard,
        title: "Debt",
        value: formatNaira(debtTotalRemaining, { compact: debtTotalRemaining > 999_999 }),
        trendValue: null,
        trendUp: null,
        trendPositive: false,
        badge: hasDebt ? "Outstanding" : "Cleared",
        badgeVariant: (hasDebt ? "warning" : "positive") as BadgeVariant,
        sparklineData: null,
        supportingText: debtText,
      },
      {
        id: "budgetHealth",
        icon: PieChart,
        title: "Budget Health",
        value: budgetCount > 0 ? `${budgetHealth.healthy} / ${budgetCount}` : "\u2014",
        trendValue: null,
        trendUp: null,
        trendPositive: false,
        badge: bhBadge,
        badgeVariant: bhVariant,
        sparklineData: null,
        supportingText: budgetText,
      },
    ];
  }, [
    monthlyIncome, monthlyExpenses, monthlySavings,
    incomeTrend, expenseTrend, savingsTrend,
    debtTotalRemaining, debtCount,
    budgetHealth, budgetCount, monthlyChart,
  ]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map((card) => {
        const hasTrend = card.trendUp !== null;
        const hasSparkline = card.sparklineData && card.sparklineData.length > 0;
        const showsVisuals = hasTrend && hasSparkline;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2, scale: 1.01 }}
            className="flex flex-col rounded-[20px] border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-foreground/10 cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground">
                <card.icon className="h-4 w-4" />
              </div>
              <StatusBadge text={card.badge} variant={card.badgeVariant} />
            </div>

            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5">
              {card.title}
            </p>
            <p className="text-[26px] font-bold leading-none tracking-tight text-foreground tabular-nums">
              {card.value}
            </p>

            <div className="mt-auto pt-3">
              {showsVisuals ? (
                <>
                  <div className="flex items-center gap-3">
                    <TrendPill
                      value={card.trendValue!}
                      up={card.trendUp!}
                      positive={card.trendPositive}
                    />
                    <CardSparkline data={card.sparklineData!} />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{card.supportingText}</p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">{card.supportingText}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
