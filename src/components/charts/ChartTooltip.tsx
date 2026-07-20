import { memo, type CSSProperties } from "react";

const baseStyle: CSSProperties = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number; name?: string; color?: string }[];
  label?: string;
  formatter?: (v: number) => string;
  labelFormatter?: (label: string) => string;
}

export const ChartTooltip = memo(function ChartTooltip({ active, payload, label, formatter, labelFormatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={baseStyle} className="px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-1">
        {labelFormatter ? labelFormatter(label ?? "") : label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name ? `${entry.name}: ` : ""}
          {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
});
