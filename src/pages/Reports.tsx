import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUp, ArrowDown,
  Filter, X, BarChart3, Table2, FileText, ArrowLeftRight, AlertTriangle,
  TrendingUp as TrendUpIcon, TrendingDown as TrendDownIcon, Minus,
  Target, Star, Activity,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatNaira, formatPercent, formatDate } from "@/lib/format";
import { notify } from "@/services/notifications";
import { useReportsPage } from "@/features/reports/hooks";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { ChartCard } from "@/components/charts/ChartCard";
import { CategoryChart } from "@/components/charts/CategoryChart";
import { DebtBreakdownChart } from "@/components/charts/DebtBreakdownChart";
import { AccountBalancesChart } from "@/components/charts/AccountBalancesChart";
import { SavingsTrendChart } from "@/components/charts/SavingsTrendChart";
import { CompletionForecastChart } from "@/components/charts/CompletionForecastChart";
import {
  getGoalCompletionForecast, getGoalOverallTimeline,
  calculateGoalMetrics, calculateDebtMetrics,
  useFinanceStore,
} from "@/store/finance";
import { calculateBudgetMetrics } from "@/services/budget-matching";
import { computeAccountBalance } from "@/services/account-balance";
import type { DateRangePreset } from "@/services/reports";
import type { ExportFormat } from "@/services/export";
const RANGE_OPTIONS: { label: string; value: DateRangePreset }[] = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "Custom", value: "custom" },
];

function PctBadge({ value, invert = false }: { value: number; invert?: boolean }) {
  const isGood = invert ? value <= 0 : value >= 0;
  if (Math.abs(value) < 0.5) return null;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs font-medium ml-2",
      isGood ? "text-success" : "text-destructive",
    )}>
      {value > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function TrendIndicator({ trend }: { trend: { direction: string; pctChange: number } }) {
  const { direction, pctChange } = trend;
  if (direction === "stable") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        Stable
      </span>
    );
  }
  const isUp = direction === "up";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-medium",
      isUp ? "text-destructive" : "text-success",
    )}>
      {isUp ? <TrendUpIcon className="h-3 w-3" /> : <TrendDownIcon className="h-3 w-3" />}
      {isUp ? "Rising" : "Falling"} ({Math.abs(pctChange).toFixed(1)}%)
    </span>
  );
}

function FilterSelect({
  label, value, options, onChange, placeholder,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs px-2 py-0">
          <SelectValue placeholder={placeholder ?? "All"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, colorClass, comparison, invertComparison,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  colorClass: string;
  comparison?: { pctChange: number } | null;
  invertComparison?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-elegant">
      <div className="flex items-center gap-3">
        <div className={cn("grid h-10 w-10 place-items-center rounded-lg", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-lg font-bold truncate">{value}</p>
        </div>
      </div>
      {comparison && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <PctBadge value={comparison.pctChange} invert={invertComparison} />
          <span className="text-[10px] text-muted-foreground">vs previous period</span>
        </div>
      )}
    </div>
  );
}

function HealthScoreGauge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80 ? "text-success" :
    score >= 60 ? "text-warning" :
    score >= 40 ? "text-amber-500" :
    score >= 20 ? "text-orange-500" :
    "text-destructive";
  const barColor =
    score >= 80 ? "bg-success" :
    score >= 60 ? "bg-warning" :
    score >= 40 ? "bg-amber-500" :
    score >= 20 ? "bg-orange-500" :
    "bg-destructive";
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={`${score * 1.005} 100`}
            strokeLinecap="round" className={color} />
        </svg>
        <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold", color)}>
          {score}
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-display text-lg font-bold">{label}</p>
        <div className="mt-1 h-1.5 w-full max-w-[120px] rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const {
    report, insights,
    preset, setRangePreset, customStart, customEnd, setCustomRange,
    filters, setFilter, clearFilters, filterOptions,
    comparison, comparisonMode, toggleComparison,
    exportReport,
  } = useReportsPage();
  const transactions = useFinanceStore((s) => s.transactions);
  const goals = useFinanceStore((s) => s.goals);
  const budgets = useFinanceStore((s) => s.budgets);
  const debts = useFinanceStore((s) => s.debts);
  const accounts = useFinanceStore((s) => s.accounts);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const analytics = useMemo(() => ({
    completionForecast: getGoalCompletionForecast(goals, transactions),
    overallTimeline: getGoalOverallTimeline(goals, transactions),
  }), [goals, transactions]);

  const goalsWithMetrics = useMemo(
    () => goals.map((g) => ({ ...g, metrics: calculateGoalMetrics(g, transactions) })),
    [goals, transactions],
  );

  const budgetChartData = useMemo(() =>
    budgets.map((b) => {
      const m = calculateBudgetMetrics(b, transactions);
      return {
        name: b.name.length > 14 ? b.name.slice(0, 14) + "\u2026" : b.name,
        spent: m.spent,
        budget: b.amount,
        pct: m.percentage,
      };
    }),
    [budgets, transactions],
  );

  const debtChartData = useMemo(() =>
    debts.map((d) => {
      const m = calculateDebtMetrics(d, transactions);
      return {
        name: d.name,
        balance: m.remainingBalance,
        originalAmount: d.originalAmount,
        paidPct: m.percentagePaid,
      };
    }),
    [debts, transactions],
  );

  const accountChartData = useMemo(() =>
    accounts.map((a) => ({ name: a.name, balance: computeAccountBalance(a, transactions), type: a.type })),
    [accounts, transactions],
  );

  const hasActiveFilters = filters.categories.length > 0 || filters.accounts.length > 0 || filters.types.length > 0 || filters.budgetIds.length > 0;

  const catValue = filters.categories[0] ?? "_all";
  const accValue = filters.accounts[0] ?? "_all";
  const typeValue = filters.types[0] ?? "_all";

  const setSingleFilter = useCallback((key: "categories" | "accounts" | "types", value: string) => {
    setFilter(key, (value === "_all" ? [] : [value]) as never);
  }, [setFilter]);

  const activeFilterCount = [
    filters.categories.length > 0,
    filters.accounts.length > 0,
    filters.types.length > 0,
    filters.budgetIds.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Deep insights into your financial habits."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30" role="group" aria-label="Date range">
              {RANGE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setRangePreset(opt.value)}
                  aria-pressed={preset === opt.value}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${preset === opt.value ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            {preset === "custom" && (
              <div className="flex items-center gap-2">
                <input type="date" value={customStart ?? ""} onChange={(e) => setCustomRange(e.target.value, customEnd ?? e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs w-auto max-w-[140px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Start date" />
                <span className="text-xs text-muted-foreground">to</span>
                <input type="date" value={customEnd ?? ""} onChange={(e) => setCustomRange(customStart ?? e.target.value, e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs w-auto max-w-[140px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="End date" />
              </div>
            )}
          </div>
        }
      />

      {/* ── Filter & Action Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-elegant"
      >
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />

        <FilterSelect
          label="Category"
          value={catValue}
          options={[
            { value: "_all", label: "All Categories" },
            ...filterOptions.categories.map((c) => ({ value: c, label: c })),
          ]}
          onChange={(v) => setSingleFilter("categories", v)}
        />

        <div className="hidden sm:block w-px h-5 bg-border" aria-hidden="true" />

        <FilterSelect
          label="Account"
          value={accValue}
          options={[
            { value: "_all", label: "All Accounts" },
            ...filterOptions.accounts.map((a) => ({ value: a, label: a })),
          ]}
          onChange={(v) => setSingleFilter("accounts", v)}
        />

        <div className="hidden sm:block w-px h-5 bg-border" aria-hidden="true" />

        <FilterSelect
          label="Type"
          value={typeValue}
          options={[
            { value: "_all", label: "All Types" },
            { value: "income", label: "Income" },
            { value: "expense", label: "Expense" },
            { value: "transfer", label: "Transfer" },
          ]}
          onChange={(v) => setSingleFilter("types", v)}
        />

        <div className="hidden sm:block w-px h-5 bg-border" aria-hidden="true" />

        <Button
          variant={comparisonMode ? "secondary" : "outline"}
          size="sm"
          onClick={toggleComparison}
          className="h-7 text-xs gap-1"
          aria-pressed={comparisonMode}
        >
          <ArrowLeftRight className="h-3 w-3" />
          {comparisonMode ? "Comparing" : "Compare"}
        </Button>

        <div className="ml-auto flex items-center gap-1.5">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
              <X className="h-3 w-3" />
              Clear ({activeFilterCount})
            </Button>
          )}

          <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5 bg-muted/20" role="group" aria-label="Export options">
            <button type="button" onClick={() => { exportReport("csv"); notify.success("CSV exported", "", "export"); }}
              className="p-1.5 rounded-md hover:bg-muted/50 transition text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Export CSV">
              <Table2 className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => { exportReport("excel"); notify.success("Excel exported", "", "export"); }}
              className="p-1.5 rounded-md hover:bg-muted/50 transition text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Export Excel">
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => { exportReport("pdf"); notify.success("PDF report opened", "", "export"); }}
              className="p-1.5 rounded-md hover:bg-muted/50 transition text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Export PDF">
              <FileText className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Comparison Banner ── */}
      {comparisonMode && comparison && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="rounded-xl border border-border bg-muted/20 p-3"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{comparison.periodLabel}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {comparison.entries.map((entry) => (
              <div key={entry.label} className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">{entry.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display font-bold text-sm">{formatNaira(entry.current)}</span>
                  <span className="text-[11px] text-muted-foreground">vs {formatNaira(entry.previous)}</span>
                </div>
                <div className="flex items-center mt-1">
                  <span className={cn(
                    "text-xs font-medium",
                    entry.pctChange >= 0 ? (entry.isPositive ? "text-success" : "text-destructive") : (entry.isPositive ? "text-destructive" : "text-success"),
                  )}>
                    {entry.pctChange >= 0 ? "+" : ""}{entry.pctChange.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">
                    {entry.isPositive ? (entry.label === "Expenses" ? "\u2193 good" : "\u2191 good") : (entry.label === "Expenses" ? "\u2191 bad" : "\u2193 bad")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {comparisonMode && !comparison && (
        <div className="rounded-xl border border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
          No comparison data available for this period.
        </div>
      )}

      {/* ── Financial Insights ── */}
      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="rounded-xl border bg-card p-5 shadow-elegant"
      >
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="font-display font-semibold">Financial Insights</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Health Score */}
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground mb-2">Financial Health</p>
            <HealthScoreGauge score={insights.healthScore.score} label={insights.healthScore.label} />
          </div>

          {/* Highest Spending Category */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendDownIcon className="h-4 w-4 text-destructive" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">Highest Spending</p>
            </div>
            {insights.highestSpendingCategory ? (
              <>
                <p className="font-display font-bold text-sm truncate">{insights.highestSpendingCategory.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatNaira(insights.highestSpendingCategory.amount)} &middot; {insights.highestSpendingCategory.pctOfTotal.toFixed(1)}% of expenses
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No expenses recorded</p>
            )}
          </div>

          {/* Largest Single Expense */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">Largest Expense</p>
            </div>
            {insights.largestExpense ? (
              <>
                <p className="font-display font-bold text-sm truncate">{formatNaira(insights.largestExpense.amount)}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {insights.largestExpense.description} &middot; {formatDate(insights.largestExpense.date)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No expenses recorded</p>
            )}
          </div>

          {/* Fastest Growing Goal */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-success" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">Fastest Growing Goal</p>
            </div>
            {insights.fastestGrowingGoal ? (
              <>
                <p className="font-display font-bold text-sm truncate">{insights.fastestGrowingGoal.goalName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatNaira(insights.fastestGrowingGoal.monthlyRate)}/mo &middot; {insights.fastestGrowingGoal.pct.toFixed(1)}% complete
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No savings goals</p>
            )}
          </div>

          {/* Budget Overspending */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={cn("h-4 w-4", insights.budgetOverspending.overspentCount > 0 ? "text-destructive" : "text-success")} aria-hidden="true" />
              <p className="text-xs text-muted-foreground">Budget Overspending</p>
            </div>
            {insights.budgetOverspending.overspentCount > 0 ? (
              <>
                <p className="font-display font-bold text-sm truncate">
                  {insights.budgetOverspending.overspentCount} budget{insights.budgetOverspending.overspentCount > 1 ? "s" : ""} overspent
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatNaira(insights.budgetOverspending.totalOverspent)} over budget
                  {insights.budgetOverspending.overspentNames.length > 0 && (
                    <> &middot; {insights.budgetOverspending.overspentNames.join(", ")}</>
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm text-success">All budgets on track</p>
            )}
          </div>

          {/* Spending Trend */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">Spending Trend</p>
            </div>
            <TrendIndicator trend={insights.spendingTrend} />
            <p className="text-xs text-muted-foreground mt-1">
              {formatNaira(insights.spendingTrend.currentPeriodTotal)} this period
            </p>
          </div>

          {/* Income Trend */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">Income Trend</p>
            </div>
            <TrendIndicator trend={insights.incomeTrend} />
            <p className="text-xs text-muted-foreground mt-1">
              {formatNaira(insights.incomeTrend.currentPeriodTotal)} this period
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── Summary KPI Cards ── */}
      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          icon={TrendingUp} label="Total Income"
          value={formatNaira(report.incomeExpenses.totalIncome)}
          colorClass="bg-success/10 text-success"
          comparison={comparison?.entries[0] ?? null}
        />
        <KpiCard
          icon={TrendingDown} label="Total Expenses"
          value={formatNaira(report.incomeExpenses.totalExpenses)}
          colorClass="bg-destructive/10 text-destructive"
          comparison={comparison?.entries[1] ?? null}
          invertComparison
        />
        <KpiCard
          icon={Wallet} label="Net Cash Flow"
          value={`${report.incomeExpenses.netCashFlow >= 0 ? "+" : ""}${formatNaira(report.incomeExpenses.netCashFlow)}`}
          colorClass={report.incomeExpenses.netCashFlow >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}
          comparison={comparison?.entries[2] ?? null}
        />
        <KpiCard
          icon={PiggyBank} label="Account Balance"
          value={formatNaira(report.accountBalances.totalBalance)}
          colorClass="bg-primary/10 text-primary"
        />
      </motion.section>

      {/* ── Charts Grid ── */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Income vs Expenses" subtitle="Monthly comparison" headingLevel="h2" loading={!mounted} empty={report.monthlyChart.length === 0} emptyMessage="No transactions in this period.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNaira(v, { compact: true })} />
              <Tooltip content={<ChartTooltip formatter={(v) => formatNaira(v)} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="rect" iconSize={8} />
              <Bar dataKey="income" name="Income" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} animationBegin={0} animationDuration={600} />
              <Bar dataKey="expenses" name="Expenses" fill="hsl(0 72% 55%)" radius={[6, 6, 0, 0]} animationBegin={150} animationDuration={600} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Spending Trend" subtitle="Expenses over time" headingLevel="h2" loading={!mounted} empty={report.monthlyChart.length === 0} emptyMessage="No expenses in this period.">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={report.monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNaira(v, { compact: true })} />
              <Tooltip content={<ChartTooltip formatter={(v) => formatNaira(v)} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="line" iconSize={8} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="hsl(0 72% 55%)" strokeWidth={3} dot={{ r: 4, fill: "hsl(0 72% 55%)" }} activeDot={{ r: 6 }} animationBegin={0} animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cash Flow" subtitle="Net income each month" headingLevel="h2" loading={!mounted} empty={report.monthlyChart.length === 0} emptyMessage="No transactions in this period.">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={report.monthlyChart}>
              <defs>
                <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(159 64% 45%)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(159 64% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNaira(v, { compact: true })} />
              <Tooltip content={<ChartTooltip formatter={(v) => formatNaira(v)} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="line" iconSize={8} />
              <Area type="monotone" dataKey="net" name="Net cash flow" stroke="hsl(159 64% 45%)" strokeWidth={3} fill="url(#cashflowGradient)" dot={{ r: 4 }} animationBegin={0} animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Budget Performance" subtitle="Spent vs budgeted amount" headingLevel="h2" loading={!mounted} empty={budgetChartData.length === 0} emptyMessage="No budgets configured.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetChartData} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNaira(v, { compact: true })} />
              <YAxis type="category" dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" width={90} />
              <Tooltip content={<ChartTooltip formatter={(v) => formatNaira(v)} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="rect" iconSize={8} />
              <Bar dataKey="spent" name="Spent" fill="hsl(0 72% 55%)" radius={[0, 4, 4, 0]} animationBegin={0} animationDuration={600} />
              <Bar dataKey="budget" name="Budget" fill="hsl(217 91% 60%)" radius={[0, 4, 4, 0]} animationBegin={150} animationDuration={600} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Savings Growth" subtitle="Goal contributions over time" headingLevel="h2" loading={!mounted} empty={report.savingsGrowth.monthly.length === 0} emptyMessage="No savings contributions yet.">
          <SavingsTrendChart data={report.savingsGrowth.monthly} height={256} showArea />
        </ChartCard>

        <ChartCard title="Debt Breakdown" subtitle="Remaining balance by lender" headingLevel="h2" loading={!mounted} empty={debtChartData.length === 0} emptyMessage="No debts recorded.">
          <DebtBreakdownChart data={debtChartData} height={256} />
        </ChartCard>

        <ChartCard title="Spending by Category" subtitle="Where your money goes" headingLevel="h2" loading={!mounted} empty={report.categoryBreakdown.length === 0} emptyMessage="No expenses in this period.">
          <CategoryChart data={report.categoryBreakdown} height={256} />
        </ChartCard>

        <ChartCard title="Account Balances" subtitle="Balance per account" headingLevel="h2" loading={!mounted} empty={accountChartData.length === 0} emptyMessage="No accounts created.">
          <AccountBalancesChart data={accountChartData} height={256} />
        </ChartCard>
      </div>

      {/* ── Savings Analytics Cards ── */}
      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
        className="grid gap-4 grid-cols-2 sm:grid-cols-4"
      >
        <div className="rounded-xl border bg-card p-4 shadow-elegant">
          <p className="text-xs text-muted-foreground">Active Goals</p>
          <p className="font-display text-lg font-bold">{goals.length}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
            <span>With progress</span>
            <span className="font-semibold text-foreground">{goalsWithMetrics.filter((g) => g.metrics.saved > 0).length}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-elegant">
          <p className="text-xs text-muted-foreground">Avg Monthly Savings</p>
          <p className="font-display text-lg font-bold">{formatNaira(analytics.overallTimeline.combinedMonthlyRate)}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
            <span>Monthly rate</span>
            <span className="font-semibold text-foreground">{formatNaira(analytics.overallTimeline.combinedMonthlyRate)}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-elegant">
          <p className="text-xs text-muted-foreground">Total Saved</p>
          <p className="font-display text-lg font-bold">{formatNaira(report.savingsGrowth.totalSaved)}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
            <span>of {formatNaira(report.savingsGrowth.totalTarget)}</span>
            <span className="font-semibold text-foreground">{formatPercent(report.savingsGrowth.pct)}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-elegant">
          <p className="text-xs text-muted-foreground">Projected Completion</p>
          <p className="font-display text-lg font-bold">
            {analytics.overallTimeline.estimatedMonths ? `${analytics.overallTimeline.estimatedMonths}mo` : "\u2014"}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
            <span>Monthly rate</span>
            <span className="font-semibold text-foreground">
              {analytics.overallTimeline.combinedMonthlyRate > 0 ? formatNaira(analytics.overallTimeline.combinedMonthlyRate) : "\u2014"}
            </span>
          </div>
        </div>
      </motion.section>

      {/* ── Goal Completion Forecast ── */}
      <div className="rounded-xl border bg-card p-5 shadow-elegant">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold">Goal Completion Forecast</h2>
            <p className="text-xs text-muted-foreground">Projected completion for each goal based on current saving rate</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{formatNaira(report.savingsGrowth.totalSaved)}</p>
            <p className="text-xs text-muted-foreground">of {formatNaira(report.savingsGrowth.totalTarget)} ({formatPercent(report.savingsGrowth.pct)})</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <CompletionForecastChart data={analytics.completionForecast} height={Math.max(goals.length * 60 + 40, 200)} />
          <div className="space-y-2">
            {analytics.completionForecast.length === 0 ? (
              <p className="text-sm text-muted-foreground">No savings goals yet.</p>
            ) : (
              analytics.completionForecast.map((f) => (
                <div key={f.goalId} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{f.goalName}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "shrink-0 text-[10px]",
                        f.remaining <= 0 ? "bg-success/15 text-success" :
                        f.onTrack ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
                      )}
                    >
                      {f.remaining <= 0 ? "Completed" : f.onTrack ? "On Track" : "Behind"}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatNaira(f.saved)} / {formatNaira(f.target)}</span>
                    <span className="font-medium text-foreground">
                      {f.estimatedDate ? `Est. ${formatDate(f.estimatedDate)}` : f.monthlyRate > 0 ? "Insufficient data" : "No contributions"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Monthly rate: {formatNaira(f.monthlyRate)}</span>
                    <span>{f.monthsToCompletion !== null ? `${f.monthsToCompletion}mo to goal` : "\u2014"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Projected Completion Timeline ── */}
      {analytics.overallTimeline.forecastMonths.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-elegant">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold">Projected Completion Timeline</h2>
              <p className="text-xs text-muted-foreground">Forecast based on current savings rate</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">
                {analytics.overallTimeline.estimatedMonths ? `~${analytics.overallTimeline.estimatedMonths} months` : "\u2014"}
              </p>
              <p className="text-xs text-muted-foreground">
                {analytics.overallTimeline.estimatedDate ? `by ${formatDate(analytics.overallTimeline.estimatedDate)}` : ""}
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={analytics.overallTimeline.forecastMonths}>
                <defs>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(159 64% 45%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(159 64% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatNaira(v, { compact: true })} />
                <Tooltip content={<ChartTooltip formatter={(v) => formatNaira(v)} />} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="line" iconSize={8} />
                <Area type="monotone" dataKey="cumulative" name="Projected savings" stroke="hsl(159 64% 45%)" strokeWidth={3} fill="url(#forecastGradient)" dot={{ r: 3 }} animationBegin={0} animationDuration={800} />
                <Line type="monotone" dataKey="target" name="Target" stroke="hsl(0 72% 55%)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Savings Goals Progress ── */}
      {goalsWithMetrics.length > 0 && (
        <section className="rounded-xl border bg-card p-5 shadow-elegant">
          <h2 className="font-display font-semibold mb-4">Savings Goals Progress</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {goalsWithMetrics.map((g) => {
              const m = g.metrics;
              const status = m.isCompleted ? "Completed" : m.isExpired ? "Overdue" : "On Track";
              const statusColor = m.isCompleted ? "bg-success/15 text-success" : m.isExpired ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success";
              return (
                <div key={g.id} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{g.name}</span>
                    <Badge variant="secondary" className={cn("shrink-0 text-[10px]", statusColor)}>
                      {status}
                    </Badge>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(m.percentage, 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatNaira(m.saved)} / {formatNaira(g.targetAmount)}</span>
                    <span className="font-medium text-foreground">{m.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] border-t border-border/50 pt-2">
                    <span className="text-muted-foreground">Monthly needed</span>
                    <span className="font-medium">{formatNaira(m.requiredMonthlySaving)}/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Days left</span>
                    <span className={cn("font-medium", m.daysRemaining <= 0 ? "text-destructive" : "")}>
                      {m.daysRemaining <= 0 ? "Overdue" : `${m.daysRemaining}d`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Budget Utilization ── */}
      {budgets.length > 0 && (
        <section className="rounded-xl border bg-card p-5 shadow-elegant">
          <h2 className="font-display font-semibold mb-1">Budget Utilization</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {formatNaira(report.budgetUtilization.totalSpent)} / {formatNaira(report.budgetUtilization.totalBudgeted)} ({formatPercent(report.budgetUtilization.utilization)})
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {budgets.map((b) => {
              const m = calculateBudgetMetrics(b, transactions);
              const pct = m.percentage;
              const status = pct > 100 ? "destructive" : pct >= 80 ? "warning" : "success";
              return (
                <div key={b.id} className="space-y-1.5 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{b.name}</span>
                    <span className={cn("text-xs font-semibold", status === "destructive" ? "text-destructive" : status === "warning" ? "text-warning" : "text-success")}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full rounded-full transition-all", status === "destructive" ? "bg-destructive" : status === "warning" ? "bg-warning" : "bg-success")}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatNaira(m.spent)} / {formatNaira(b.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
