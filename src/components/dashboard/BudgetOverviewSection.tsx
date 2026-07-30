import { useMemo } from "react";
import { PieChart } from "lucide-react";
import { WidgetHeader } from "@/components/dashboard/WidgetHeader";
import { DashboardBudgetCard } from "@/components/dashboard/DashboardBudgetCard";
import { cn } from "@/lib/utils";
import { getBudgetInsights, calculateBudgetMetrics } from "@/services/budget-matching";
import { useFinanceStore } from "@/store/finance";
import { Link } from "react-router-dom";

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[20px] border border-border bg-card p-5 md:p-6 shadow-sm transition-shadow hover:shadow-md", className)}>
      {children}
    </div>
  );
}

export function BudgetOverviewSection() {
  const budgets = useFinanceStore((s) => s.budgets);
  const allTransactions = useFinanceStore((s) => s.transactions);

  const budgetsWithMetrics = useMemo(
    () => budgets.map((b) => ({
      ...b,
      metrics: calculateBudgetMetrics(b, allTransactions),
    })),
    [budgets, allTransactions],
  );

  const topBudgets = budgetsWithMetrics.slice(0, 4);

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold text-foreground">Budget Overview</h2>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <SectionCard>
            <WidgetHeader title="Active Budgets" action={{ label: "View All", to: "/budgets" }} className="mb-3" />
            {topBudgets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topBudgets.map((b) => {
                  const insights = getBudgetInsights(b, allTransactions);
                  return (
                    <DashboardBudgetCard
                      key={b.id}
                      budget={b}
                      metrics={b.metrics}
                      daysRemaining={insights.daysRemaining}
                      projectedEndSpend={insights.projectedEndSpend}
                      averageDailySpend={insights.averageDailySpend}
                      isOverBudgetForecast={insights.isOverBudgetForecast}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No active budgets.{" "}
                <Link to="/budgets" className="text-primary hover:underline font-medium">
                  Create one
                </Link>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </section>
  );
}
