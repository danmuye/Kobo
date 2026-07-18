import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { formatNaira } from "@/lib/format";
import type { MonthlyGoalSavings as MonthlySavingsEntry } from "@/store/finance";

interface SavingsTrendChartProps {
  data: MonthlySavingsEntry[];
  height?: number;
  showArea?: boolean;
}

export function SavingsTrendChart({ data, height = 256, showArea = true }: SavingsTrendChartProps) {
  if (showArea) {
    return (
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="savingsTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(280 75% 65%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(280 75% 65%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v: number) => formatNaira(v, { compact: true })} />
            <Tooltip content={<ChartTooltip formatter={(v) => formatNaira(v)} />} />
            <Area type="monotone" dataKey="contributions" stroke="hsl(280 75% 65%)" strokeWidth={3} fill="url(#savingsTrendGradient)" dot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v: number) => formatNaira(v, { compact: true })} />
          <Tooltip content={<ChartTooltip formatter={(v) => formatNaira(v)} />} />
          <Line type="monotone" dataKey="contributions" stroke="hsl(280 75% 65%)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
