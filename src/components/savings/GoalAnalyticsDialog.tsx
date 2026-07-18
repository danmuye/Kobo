import { useMemo } from "react";
import { Target, TrendingUp, Calendar, DollarSign, BarChart3, Clock, Award, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatNaira, formatDate } from "@/lib/format";
import { calculateGoalMetrics, getMatchingGoalTransactions, getGoalStatus } from "@/services/goal-matching";
import type { Goal, Transaction } from "@/types";

interface GoalAnalyticsDialogProps {
  goal: Goal | null;
  transactions: Transaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-1",
      accent ? `border-${accent}-500/30 bg-${accent}-500/5` : "border-border",
    )}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn("font-semibold", accent && `text-${accent}-500`)}>{value}</p>
    </div>
  );
}

export function GoalAnalyticsDialog({ goal, transactions, open, onOpenChange }: GoalAnalyticsDialogProps) {
  const metrics = useMemo(
    () => goal ? calculateGoalMetrics(goal, transactions) : null,
    [goal, transactions],
  );
  const matchingTxs = useMemo(
    () => goal ? getMatchingGoalTransactions(goal, transactions) : [],
    [goal, transactions],
  );

  const largestContribution = useMemo(() => {
    if (matchingTxs.length === 0) return 0;
    return Math.max(...matchingTxs.map((t) => t.amount));
  }, [matchingTxs]);

  const averageContribution = useMemo(() => {
    if (matchingTxs.length === 0) return 0;
    return matchingTxs.reduce((s, t) => s + t.amount, 0) / matchingTxs.length;
  }, [matchingTxs]);

  if (!goal || !metrics) return null;

  const statusInfo = getGoalStatus(metrics.percentage, metrics.isCompleted, metrics.isExpired);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analytics: {goal.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Target} label="Target" value={formatNaira(goal.targetAmount)} />
            <StatCard icon={DollarSign} label="Saved" value={formatNaira(metrics.saved)} accent="success" />
            <StatCard icon={TrendingUp} label="Remaining" value={formatNaira(metrics.remaining)} />
            <StatCard icon={Award} label="Status" value={statusInfo.label} accent={
              statusInfo.value === "completed" || statusInfo.value === "exceeded" ? "purple" :
              statusInfo.value === "expired" ? "destructive" :
              statusInfo.value === "behind" ? "amber" : "success"
            } />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={BarChart3} label="Avg contribution" value={formatNaira(averageContribution)} />
            <StatCard icon={ArrowUpRight} label="Largest" value={formatNaira(largestContribution)} />
            <StatCard icon={Clock} label="Projected completion" value={
              metrics.estimatedCompletionDate ? formatDate(metrics.estimatedCompletionDate) : "—"
            } />
            <StatCard icon={Calendar} label="Days remaining" value={
              metrics.isExpired ? "Expired" : `${metrics.daysRemaining} days`
            } />
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total transactions</span>
              <span className="font-semibold">{metrics.transactionCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completion rate</span>
              <span className="font-semibold">{metrics.percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(metrics.percentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
