import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function DashboardPreview() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-1 shadow-elegant backdrop-blur-sm">
      <div className="overflow-hidden rounded-xl border border-border/40 bg-background">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Reports Overview</span>
          </div>
          <div className="flex gap-1">
            <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">7D</span>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">30D</span>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">90D</span>
          </div>
        </div>
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Income</span>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <p className="mt-1 font-display text-lg font-bold text-foreground">₦1.8M</p>
              <span className="text-[10px] text-emerald-500">+12% vs last period</span>
            </div>
            <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Expenses</span>
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <p className="mt-1 font-display text-lg font-bold text-foreground">₦1.2M</p>
              <span className="text-[10px] text-rose-500">+4% vs last period</span>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-border/50 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Category Breakdown</p>
            <div className="mt-2 space-y-2">
              {[
                { label: "Housing", pct: 35, color: "bg-primary" },
                { label: "Food & Groceries", pct: 22, color: "bg-emerald-500" },
                { label: "Transport", pct: 15, color: "bg-amber-500" },
                { label: "Utilities", pct: 12, color: "bg-sky-500" },
                { label: "Entertainment", pct: 8, color: "bg-purple-500" },
                { label: "Others", pct: 8, color: "bg-muted-foreground/40" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  <span className="w-24 text-[10px] text-muted-foreground">{c.label}</span>
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-border/60">
                      <div className={`h-1.5 rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                  <span className="w-6 text-right text-[10px] text-muted-foreground">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-border/40 px-4 py-2">
          <p className="text-[10px] text-muted-foreground/50">Sample breakdown — categories based on your transactions</p>
        </div>
      </div>
    </div>
  );
}
