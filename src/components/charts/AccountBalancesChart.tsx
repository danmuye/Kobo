import { memo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { formatNaira } from "@/lib/format";

const COLORS = [
  "hsl(159 64% 45%)", "hsl(217 91% 60%)", "hsl(38 92% 50%)",
  "hsl(259 80% 60%)", "hsl(280 75% 65%)", "hsl(142 71% 45%)",
  "hsl(0 72% 55%)", "hsl(14 80% 60%)",
];

interface AccountBalancesChartProps {
  data: { name: string; balance: number; type: string }[];
  height?: number;
}

export const AccountBalancesChart = memo(function AccountBalancesChart({ data, height = 256 }: AccountBalancesChartProps) {
  const sorted = [...data].sort((a, b) => b.balance - a.balance);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          barSize={24}
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
            width={110}
          />
          <Tooltip
            content={
              <ChartTooltip
                formatter={(v) => formatNaira(v)}
                labelFormatter={(label) => {
                  const entry = sorted.find((a) => a.name === label);
                  return entry ? `${entry.name} (${entry.type})` : label;
                }}
              />
            }
          />
          <Bar dataKey="balance" name="Balance" radius={[0, 6, 6, 0]}>
            {sorted.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
