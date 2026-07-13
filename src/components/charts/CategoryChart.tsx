import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { formatNaira } from "@/lib/format";

const COLORS = [
  "hsl(159 64% 45%)", "hsl(217 91% 60%)", "hsl(38 92% 50%)",
  "hsl(0 72% 55%)", "hsl(259 80% 60%)", "hsl(280 75% 65%)",
  "hsl(142 71% 45%)", "hsl(14 80% 60%)",
];

interface CategoryChartProps {
  data: { name: string; value: number }[];
  height?: number;
}

export function CategoryChart({ data, height = 256 }: CategoryChartProps) {
  return (
    <div style={{ height }} className="flex items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={<ChartTooltip formatter={(v) => formatNaira(v)} />}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
