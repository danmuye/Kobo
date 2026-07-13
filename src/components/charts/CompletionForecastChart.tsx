import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { formatNaira } from "@/lib/format";
import type { CompletionForecast } from "@/store/finance";

interface CompletionForecastChartProps {
  data: CompletionForecast[];
  height?: number;
}

export function CompletionForecastChart({ data, height = 200 }: CompletionForecastChartProps) {
  const chartData = data.map((g) => ({
    name: g.goalName.length > 12 ? g.goalName.slice(0, 12) + "..." : g.goalName,
    saved: g.saved,
    remaining: g.remaining,
    fullName: g.goalName,
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v: number) => formatNaira(v, { compact: true })} />
          <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
          <Tooltip
            content={
              <ChartTooltip
                formatter={(v) => formatNaira(v)}
                labelFormatter={(label) => {
                  const goal = data.find((g) => g.goalName === label || g.goalName.startsWith(label.replace("...", "")));
                  return goal?.goalName ?? label;
                }}
              />
            }
          />
          <Bar dataKey="saved" name="Saved" stackId="a" fill="hsl(280 75% 65%)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="remaining" name="Remaining" stackId="a" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
