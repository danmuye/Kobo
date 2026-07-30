import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  PiggyBank, Plus, BarChart3, PieChart, Wallet, Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { HeroFinancialOverview } from "@/components/dashboard/HeroFinancialOverview";
import { AnalyticsKPICards } from "@/components/dashboard/AnalyticsKPICards";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { SnapshotMetric } from "@/components/dashboard/SnapshotMetric";

import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SavingsGoalsSection } from "@/components/dashboard/SavingsGoalsSection";
import { BudgetOverviewSection } from "@/components/dashboard/BudgetOverviewSection";
import { Button } from "@/components/ui/button";
import { formatNaira, formatPercent } from "@/lib/format";
import { useDashboardMetrics } from "@/features/dashboard/hooks";
import { useFinanceStore, calculateGoalMetrics, calculateDebtTotals } from "@/store/finance";
import { calculateBudgetMetrics } from "@/services/budget-matching";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuthContext } from "@/contexts/auth-context";

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[20px] border border-border bg-card p-5 md:p-6 shadow-sm transition-shadow hover:shadow-md ${className ?? ""}`}>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthContext();
  const greetingName = user?.displayName ?? user?.email?.split("@")[0] ?? "there";
  const {
    totalBalance, income, expenses, savings, monthlyChart,
    cashFlow, recentTransactions,
    availableBalance, accountHealth,
    netCashFlow,
  } = useDashboardMetrics();
  const transactions = recentTransactions;
  const goals = useFinanceStore((s) => s.goals);
  const budgets = useFinanceStore((s) => s.budgets);
  const debts = useFinanceStore((s) => s.debts);
  const allTransactions = useFinanceStore((s) => s.transactions);

  const hasTransactions = transactions.length > 0;

  const monthlyChange = useMemo(() => {
    if (monthlyChart.length < 2) return 0;
    const last = monthlyChart[monthlyChart.length - 1];
    const prev = monthlyChart[monthlyChart.length - 2];
    const lastNet = last.income - last.expenses;
    const prevNet = prev.income - prev.expenses;
    if (prevNet === 0) return lastNet > 0 ? 100 : 0;
    return ((lastNet - prevNet) / Math.abs(prevNet)) * 100;
  }, [monthlyChart]);

  const sparklineData = useMemo(
    () => monthlyChart.map((m) => m.income - m.expenses),
    [monthlyChart],
  );

  const debtTotals = useMemo(
    () => calculateDebtTotals(debts, allTransactions),
    [debts, allTransactions],
  );

  const metricTrends = useMemo(() => {
    if (monthlyChart.length < 2) return {
      incomeTrend: { direction: "up" as const, value: 0 },
      expenseTrend: { direction: "up" as const, value: 0 },
      savingsTrend: { direction: "up" as const, value: 0 },
    };
    const last = monthlyChart[monthlyChart.length - 1];
    const prev = monthlyChart[monthlyChart.length - 2];
    const incomeVal = prev.income > 0 ? ((last.income - prev.income) / prev.income) * 100 : 0;
    const expenseVal = prev.expenses > 0 ? ((last.expenses - prev.expenses) / prev.expenses) * 100 : 0;
    const lastSav = last.income - last.expenses;
    const prevSav = prev.income - prev.expenses;
    const savingsVal = prevSav > 0 ? ((lastSav - prevSav) / prevSav) * 100 : (lastSav > 0 ? 100 : 0);
    return {
      incomeTrend: { direction: incomeVal >= 0 ? "up" as const : "down" as const, value: Math.abs(incomeVal) },
      expenseTrend: { direction: expenseVal >= 0 ? "up" as const : "down" as const, value: Math.abs(expenseVal) },
      savingsTrend: { direction: savingsVal >= 0 ? "up" as const : "down" as const, value: Math.abs(savingsVal) },
    };
  }, [monthlyChart]);

  const goalsWithMetrics = useMemo(
    () => goals.map((g) => ({ ...g, metrics: calculateGoalMetrics(g, allTransactions) })),
    [goals, allTransactions],
  );

  const budgetsWithMetrics = useMemo(
    () => budgets.map((b) => ({
      ...b,
      metrics: calculateBudgetMetrics(b, allTransactions),
    })),
    [budgets, allTransactions],
  );

  const budgetHealth = useMemo(() => {
    const healthy = budgetsWithMetrics.filter((b) => b.metrics.percentage < 75).length;
    const nearLimit = budgetsWithMetrics.filter((b) => b.metrics.percentage >= 75 && b.metrics.percentage < 100).length;
    const exceeded = budgetsWithMetrics.filter((b) => b.metrics.percentage >= 100).length;
    return { healthy, nearLimit, exceeded };
  }, [budgetsWithMetrics]);

  const budgetUtilization = useMemo(() => {
    if (budgetsWithMetrics.length === 0) return 0;
    return budgetsWithMetrics.reduce((s, b) => s + b.metrics.percentage, 0) / budgetsWithMetrics.length;
  }, [budgetsWithMetrics]);

  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  const hasBudgets = budgets.length > 0;

  return (
    <div className="py-4 sm:py-5 lg:py-6 space-y-6 lg:space-y-8 w-full">
      {/* Welcome Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {greetingName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s how your money is moving this month.</p>
        </div>
        <Button asChild className="hidden sm:inline-flex rounded-full">
          <Link to="/transactions"><Plus className="h-4 w-4 mr-1" /> New Transaction</Link>
        </Button>
      </div>

      {!hasTransactions ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-16">
          <EmptyState
            icon={BarChart3}
            title="No transactions yet"
            description="Add your first transaction to see your financial dashboard with charts, budgets, and insights."
            action={{ label: "Add Transaction", onClick: () => window.location.href = "/transactions" }}
          />
        </motion.div>
      ) : (
        <>
          {/* Section: Financial Overview */}
          <section>
            <HeroFinancialOverview
              totalBalance={totalBalance}
              availableBalance={availableBalance}
              monthlyChange={monthlyChange}
              netCashFlow={netCashFlow}
              monthlyIncome={income}
              monthlyExpenses={expenses}
              monthlySavings={savings}
              incomeTrend={metricTrends.incomeTrend}
              expenseTrend={metricTrends.expenseTrend}
              savingsTrend={metricTrends.savingsTrend}
              debtTotalRemaining={debtTotals.totalRemaining}
              budgetHealth={budgetHealth}
              budgetCount={budgets.length}
              savingsRate={savingsRate}
              budgetUtilization={budgetUtilization}
              activeAccounts={accountHealth.length}
              sparklineData={sparklineData}
              onAddTransaction={() => window.location.href = "/transactions"}
              onTransfer={() => window.location.href = "/transactions"}
              onCreateBudget={() => window.location.href = "/budgets"}
              onCreateGoal={() => window.location.href = "/goals"}
              onRecordDebtPayment={() => window.location.href = "/debts"}
            />
          </section>

          {/* Section: Cash Flow & Snapshot */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold text-foreground">Analytics</h2>
            </div>

            <div className="mb-4">
              <AnalyticsKPICards
                monthlyIncome={income}
                monthlyExpenses={expenses}
                monthlySavings={savings}
                incomeTrend={metricTrends.incomeTrend}
                expenseTrend={metricTrends.expenseTrend}
                savingsTrend={metricTrends.savingsTrend}
                debtTotalRemaining={debtTotals.totalRemaining}
                debtCount={debtTotals.count}
                budgetHealth={budgetHealth}
                budgetCount={budgets.length}
                monthlyChart={monthlyChart}
              />
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-8">
                <CashFlowChart cashFlow={cashFlow} />
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-3">
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">Financial Snapshot</h3>
                  <p className="text-sm text-muted-foreground mt-1">Key financial indicators</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SnapshotMetric
                    label="Net Worth"
                    value={formatNaira(totalBalance, { compact: totalBalance > 999_999 })}
                    icon={Wallet}
                    description="Total balance"
                  />
                  <SnapshotMetric
                    label="Savings Rate"
                    value={formatPercent(savingsRate)}
                    trend={{ direction: savingsRate > 0 ? "up" : "stable", value: `${Math.round(savingsRate)}%` }}
                    icon={PiggyBank}
                    variant={savingsRate > 10 ? "positive" : savingsRate > 0 ? "default" : "warning"}
                    description="of income saved"
                  />
                  <SnapshotMetric
                    label="Budget Utilization"
                    value={hasBudgets ? `${Math.round(budgetUtilization)}%` : "N/A"}
                    icon={PieChart}
                    variant={hasBudgets && budgetUtilization > 100 ? "critical" : hasBudgets && budgetUtilization > 75 ? "warning" : hasBudgets ? "positive" : "default"}
                    description={hasBudgets ? `${budgetHealth.healthy} healthy, ${budgetHealth.exceeded} over` : "No budgets set"}
                  />
                  <SnapshotMetric
                    label="Accounts"
                    value={`${accountHealth.length} active`}
                    icon={Wallet}
                    variant={accountHealth.length > 0 ? "positive" : "default"}
                    description={`${accountHealth.length} ${accountHealth.length === 1 ? "account" : "accounts"} tracked`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Transactions & Goals */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold text-foreground">Recent Activity</h2>
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-6">
                <RecentTransactions transactions={transactions} />
              </div>

              <div className="col-span-12 lg:col-span-6">
                <SavingsGoalsSection goals={goalsWithMetrics} />
              </div>
            </div>
          </section>

          <BudgetOverviewSection />
        </>
      )}
    </div>
  );
}
