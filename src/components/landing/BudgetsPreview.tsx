import { motion } from "framer-motion";

export default function BudgetsPreview() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-1 shadow-elegant backdrop-blur-sm">
      <div className="overflow-hidden rounded-xl border border-border/40 bg-background">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">Monthly Budgets</span>
          <span className="text-[10px] text-muted-foreground/60">June 2026</span>
        </div>
        <div className="space-y-2 p-4">
          {[
            { label: "Food & Dining", spent: 185000, limit: 250000, color: "bg-emerald-500" },
            { label: "Transport", spent: 72000, limit: 100000, color: "bg-sky-500" },
            { label: "Entertainment", spent: 45000, limit: 80000, color: "bg-purple-500" },
            { label: "Shopping", spent: 92000, limit: 150000, color: "bg-amber-500" },
            { label: "Utilities", spent: 65000, limit: 70000, color: "bg-rose-500" },
          ].map((b) => {
            const pct = Math.min(Math.round((b.spent / b.limit) * 100), 100);
            const isNear = pct >= 80;
            return (
              <div key={b.label} className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{b.label}</span>
                  <span className={`text-[10px] font-medium ${isNear ? "text-rose-500" : "text-muted-foreground"}`}>
                    ₦{(b.spent / 1000).toFixed(0)}K / ₦{(b.limit / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="h-2 rounded-full bg-border/60">
                  <div
                    className={`h-2 rounded-full ${b.color} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border/40 px-4 py-2">
          <p className="text-[10px] text-muted-foreground/50">Sample budgets — create your own categories and limits</p>
        </div>
      </div>
    </div>
  );
}
