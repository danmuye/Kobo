import { Landmark } from "lucide-react";

export default function DebtPreview() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-1 shadow-elegant backdrop-blur-sm">
      <div className="overflow-hidden rounded-xl border border-border/40 bg-background">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">Debt Overview</span>
          <Landmark className="h-3.5 w-3.5 text-muted-foreground/60" />
        </div>
        <div className="space-y-3 p-4">
          {[
            { name: "Student Loan", remaining: 840000, original: 1500000, rate: "4.5%", color: "bg-primary" },
            { name: "Credit Card", remaining: 320000, original: 500000, rate: "22%", color: "bg-rose-500" },
            { name: "Car Loan", remaining: 950000, original: 1200000, rate: "6%", color: "bg-sky-500" },
          ].map((d) => {
            const pct = Math.round((1 - d.remaining / d.original) * 100);
            return (
              <div key={d.name} className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{d.name}</span>
                  <span className="text-[10px] text-muted-foreground">{d.rate} APR</span>
                </div>
                <div className="h-2 rounded-full bg-border/60">
                  <div
                    className={`h-2 rounded-full ${d.color} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground/60">
                  <span>₦{(d.remaining / 1000).toFixed(0)}K remaining</span>
                  <span>{pct}% paid off</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border/40 px-4 py-2">
          <p className="text-[10px] text-muted-foreground/50">Sample debts — track your actual obligations with payoff timelines</p>
        </div>
      </div>
    </div>
  );
}
