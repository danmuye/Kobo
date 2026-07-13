import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { formatNaira } from "@/lib/format";

const COLORS = [
  "hsl(0 72% 55%)", "hsl(14 80% 60%)", "hsl(38 92% 50%)",
  "hsl(259 80% 60%)", "hsl(280 75% 65%)",
];

interface DebtBreakdownChartProps {
  data: { name: string; balance: number; originalAmount: number; paidPct: number }[];
  height?: number;
}

export function DebtBreakdownChart({ data, height = 256 }: DebtBreakdownChartProps) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    name: d.name,
    remaining: d.balance,
    paid: d.originalAmount - d.balance,
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          barSize={20}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis
            type="number"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(v: number) => formatNaira(v, { compact: true })}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            width={100}
          />
          <Tooltip
            content={
              <ChartTooltip
                formatter={(v) => formatNaira(v)}
              />
            }
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="rect" iconSize={8} />
          <Bar dataKey="paid" name="Paid off" stackId="a" fill="hsl(142 71% 45%)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="remaining" name="Remaining" stackId="a" fill="hsl(0 72% 55%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
