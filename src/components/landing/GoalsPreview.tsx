import { Target } from "lucide-react";

export default function GoalsPreview() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-1 shadow-elegant backdrop-blur-sm">
      <div className="overflow-hidden rounded-xl border border-border/40 bg-background">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">Savings Goals</span>
          <Target className="h-3.5 w-3.5 text-muted-foreground/60" />
        </div>
        <div className="space-y-3 p-4">
          {[
            { name: "Emergency Fund", saved: 1250000, target: 2000000, color: "bg-emerald-500" },
            { name: "Vacation", saved: 450000, target: 800000, color: "bg-sky-500" },
            { name: "New Laptop", saved: 320000, target: 350000, color: "bg-purple-500" },
          ].map((g) => {
            const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
            return (
              <div key={g.name} className="rounded-xl border border-border/50 bg-secondary/20 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{g.name}</span>
                  <span className="text-[10px] text-muted-foreground">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-border/60">
                  <div
                    className={`h-2 rounded-full ${g.color} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground/60">
                  <span>₦{(g.saved / 1000).toFixed(0)}K saved</span>
                  <span>Target: ₦{(g.target / 1000).toFixed(0)}K</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border/40 px-4 py-2">
          <p className="text-[10px] text-muted-foreground/50">Sample goals — set your own targets and track progress</p>
        </div>
      </div>
    </div>
  );
}
