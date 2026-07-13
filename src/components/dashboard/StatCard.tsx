import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";

interface Props {
  label: string;
  value: number;
  delta: number; // percent
  icon: LucideIcon;
  variant: "balance" | "income" | "expense" | "savings" | "goals";
  data: number[];
}

const variantMap = {
  balance: { bg: "gradient-balance", stroke: "hsl(259 80% 60%)" },
  income: { bg: "gradient-income", stroke: "hsl(142 71% 45%)" },
  expense: { bg: "gradient-expense", stroke: "hsl(0 72% 51%)" },
  savings: { bg: "gradient-savings", stroke: "hsl(217 91% 60%)" },
  goals: { bg: "gradient-goals", stroke: "hsl(280 75% 65%)" },
};

export function StatCard({ label, value, delta, icon: Icon, variant, data }: Props) {
  const v = variantMap[variant];
  const positive = delta >= 0;
  const chartData = data.map((y, x) => ({ x, y }));
  const gradientId = `spark-${variant}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-elegant hover:shadow-elevated transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight">
            {formatNaira(value, { compact: value > 999_999 })}
          </p>
        </div>
        <div className={cn("grid h-11 w-11 place-items-center rounded-xl shadow-md", v.bg)}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}
        >
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(delta).toFixed(1)}%
        </motion.div>
        <div className="h-10 flex-1 max-w-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={v.stroke} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={v.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="y"
                stroke={v.stroke}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
