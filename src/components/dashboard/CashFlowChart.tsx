import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, type TooltipProps,
} from "recharts";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CashFlowChartProps {
  cashFlow: Array<{ month: string; cashFlow: number }>;
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value ?? 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="rounded-2xl border border-border bg-card/95 backdrop-blur-md px-4 py-3 shadow-lg min-w-[140px]"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5">
        {label}
      </p>
      <div className="flex items-center gap-2.5">
        <span className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          value >= 0 ? "bg-success" : "bg-destructive",
        )} />
        <p className={cn(
          "text-sm font-bold tabular-nums",
          value >= 0 ? "text-success" : "text-destructive",
        )}>
          {value >= 0 ? "+" : ""}{formatNaira(value)}
        </p>
      </div>
    </motion.div>
  );
}

export const CashFlowChart = memo(function CashFlowChart({ cashFlow }: CashFlowChartProps) {
  const gradientId = "cf-gradient";
  const hasData = cashFlow.length > 0;

  const summary = useMemo(() => {
    if (!hasData) return null;
    const total = cashFlow.reduce((sum, item) => sum + item.cashFlow, 0);
    const count = cashFlow.length;
    const positiveCount = cashFlow.filter((item) => item.cashFlow >= 0).length;
    const avg = total / count;
    return { total, positiveCount, negativeCount: count - positiveCount, avg };
  }, [cashFlow, hasData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[20px] border border-border bg-card p-5 md:p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">Cash Flow</h3>
          <p className="text-sm text-muted-foreground mt-1">Net income each month</p>
        </div>
        {hasData && (
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 shrink-0 rounded-full bg-primary" />
            <span className="text-xs font-medium text-muted-foreground">Net Cash Flow</span>
          </div>
        )}
      </div>

      {hasData ? (
        <div className="h-[200px] md:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlow} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.4}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatNaira(v, { compact: true })}
                width={60}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{
                  stroke: "hsl(var(--muted-foreground))",
                  strokeOpacity: 0.15,
                  strokeDasharray: "4 4",
                  strokeWidth: 1,
                }}
              />
              <Area
                type="monotone"
                dataKey="cashFlow"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                strokeLinecap="round"
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2.5,
                  fill: "hsl(var(--primary))",
                }}
                isAnimationActive={true}
                animationDuration={200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-[200px] md:h-[240px] flex items-center justify-center"
        >
          <div className="text-center">
            <div className="grid h-12 w-12 place-items-center rounded-[20px] bg-muted/50 mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No cash flow data yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-[220px] mx-auto leading-relaxed">
              Add transactions to see your net cash flow over time
            </p>
          </div>
        </motion.div>
      )}

      {summary && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Net Total</p>
              <p className={cn(
                "mt-1 text-base font-bold tabular-nums",
                summary.total >= 0 ? "text-success" : "text-destructive",
              )}>
                {summary.total >= 0 ? "+" : ""}{formatNaira(summary.total)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Monthly Average</p>
              <p className={cn(
                "mt-1 text-base font-bold tabular-nums",
                summary.avg >= 0 ? "text-success" : "text-destructive",
              )}>
                {summary.avg >= 0 ? "+" : ""}{formatNaira(summary.avg)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Positive Months</p>
              <p className="mt-1 text-base font-bold tabular-nums text-foreground">
                {summary.positiveCount}/{summary.positiveCount + summary.negativeCount}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});
