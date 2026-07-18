import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChartCard } from "@/components/charts/ChartCard";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { formatNaira } from "@/lib/format";
import { getDebtAnalytics, getPaymentTrend, getOutstandingTrend, type DebtInsights } from "@/services/debt-insights";
import type { Debt, Transaction } from "@/types";
import { calculateDebtMetrics } from "@/services/debt-matching";

const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6"];

interface DebtAnalyticsDialogProps {
  debt: Debt | null;
  debts: Debt[];
  transactions: Transaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InsightsCards({ insights, debt, transactions }: { insights: DebtInsights; debt: Debt; transactions: Transaction[] }) {
  const metrics = calculateDebtMetrics(debt, transactions);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Health Score</p>
        <p className="mt-1 font-semibold text-lg">{insights.debtHealthScore}/100</p>
      </div>
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payoff Velocity</p>
        <p className="mt-1 font-semibold text-lg">{insights.payoffVelocity}%</p>
      </div>
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Monthly Avg</p>
        <p className="mt-1 font-semibold">{formatNaira(insights.averageMonthlyRepayment)}</p>
      </div>
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Est. Interest</p>
        <p className="mt-1 font-semibold">{formatNaira(insights.totalInterestEstimate)}</p>
      </div>
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Largest Payment</p>
        <p className="mt-1 font-semibold">{formatNaira(insights.largestPayment)}</p>
      </div>
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Payment</p>
        <p className="mt-1 font-semibold">{formatNaira(insights.averagePaymentSize)}</p>
      </div>
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payments/mo</p>
        <p className="mt-1 font-semibold">{insights.paymentFrequency.toFixed(1)}</p>
      </div>
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payoff Date</p>
        <p className="mt-1 font-semibold text-sm">
          {insights.estimatedPayoffDate
            ? new Date(insights.estimatedPayoffDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : "\u2014"}
        </p>
      </div>
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining</p>
        <p className="mt-1 font-semibold">{formatNaira(insights.remainingBalance)}</p>
      </div>
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid vs Target</p>
        <p className="mt-1 font-semibold">{formatNaira(metrics.amountPaid)} / {formatNaira(debt.originalAmount)}</p>
      </div>
    </div>
  );
}

export function DebtAnalyticsDialog({ debt, debts, transactions, open, onOpenChange }: DebtAnalyticsDialogProps) {
  const paymentTrend = useMemo(
    () => debt ? getPaymentTrend(debt, transactions) : [],
    [debt, transactions],
  );

  const outstandingTrend = useMemo(
    () => debt ? getOutstandingTrend(debt, transactions) : [],
    [debt, transactions],
  );

  const analytics = useMemo(
    () => debts.length > 0 ? getDebtAnalytics(debts, transactions) : null,
    [debts, transactions],
  );

  if (!debt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Debt Analytics — {debt.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <InsightsCards insights={analytics?.insights ?? null!} debt={debt} transactions={transactions} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Monthly Payments" subtitle="Last 12 months" chartHeight="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNaira(v, { compact: true })} />
                  <Tooltip content={<ChartTooltip formatter={(v) => formatNaira(v)} />} />
                  <Bar dataKey="paid" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Outstanding Balance" subtitle="Declining balance trend" chartHeight="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={outstandingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNaira(v, { compact: true })} />
                  <Tooltip content={<ChartTooltip formatter={(v) => formatNaira(v)} />} />
                  <Area type="monotone" dataKey="outstanding" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45% / 0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Payment Distribution" subtitle="Paid vs Remaining" chartHeight="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.paymentDistribution ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(analytics?.paymentDistribution ?? []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(v) => formatNaira(v)} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 text-xs mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS[0] }} />
                  <span className="text-muted-foreground">Paid</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS[1] }} />
                  <span className="text-muted-foreground">Remaining</span>
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Debt Distribution" subtitle="Across all debts" chartHeight="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.debtDistribution ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatNaira(v, { compact: true })} />
                  <YAxis dataKey="name" type="category" fontSize={10} stroke="hsl(var(--muted-foreground))" width={80} />
                  <Tooltip content={<ChartTooltip formatter={(v) => formatNaira(v)} />} />
                  <Bar dataKey="originalAmount" fill="hsl(217 91% 60%)" radius={[0, 4, 4, 0]} name="Original" />
                  <Bar dataKey="remainingBalance" fill="hsl(0 72% 55%)" radius={[0, 4, 4, 0]} name="Remaining" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Largest Payments" subtitle="Top repayment transactions" chartHeight="auto">
            <div className="space-y-2">
              {analytics?.largestPayments && analytics.largestPayments.length > 0 ? (
                analytics.largestPayments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                    <div className="min-w-0">
                      <span className="font-medium truncate">{p.description || "Payment"}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <span className="font-semibold">{formatNaira(p.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No payments recorded yet.</p>
              )}
            </div>
          </ChartCard>

          {analytics?.payoffForecast && (
            <ChartCard title="Payoff Forecast" subtitle="Debt-free projection" chartHeight="auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Months Remaining</p>
                  <p className="mt-1 font-semibold">{analytics.payoffForecast.monthsRemaining}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Est. Payoff Date</p>
                  <p className="mt-1 font-semibold text-sm">
                    {analytics.payoffForecast.estimatedPayoffDate
                      ? new Date(analytics.payoffForecast.estimatedPayoffDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                      : "\u2014"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Monthly Required</p>
                  <p className="mt-1 font-semibold">{formatNaira(analytics.payoffForecast.monthlyRequired)}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">On Track</p>
                  <p className="mt-1 font-semibold">{analytics.payoffForecast.onTrack ? "Yes" : "No"}</p>
                </div>
              </div>
            </ChartCard>
          )}

          {analytics?.utilization && (
            <ChartCard title="Debt Utilization" subtitle="Overall portfolio utilization" chartHeight="auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Original</p>
                  <p className="mt-1 font-semibold">{formatNaira(analytics.utilization.totalOriginal)}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Paid</p>
                  <p className="mt-1 font-semibold text-success">{formatNaira(analytics.utilization.totalPaid)}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Remaining</p>
                  <p className="mt-1 font-semibold">{formatNaira(analytics.utilization.totalRemaining)}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Progress</p>
                  <p className="mt-1 font-semibold">{analytics.utilization.payoffProgress.toFixed(1)}%</p>
                </div>
              </div>
            </ChartCard>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
