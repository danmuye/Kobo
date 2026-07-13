import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Plane, Laptop, Home, Shield, Plus, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatNaira, formatDate } from "@/lib/format";
import type { SavingsGoal, GoalContributionEntry } from "@/types";
import type { GoalProgressInfo } from "@/store/finance";
import { ContributionHistory } from "@/components/savings/ContributionHistory";
const iconMap: Record<string, LucideIcon> = {
  shield: Shield,
  plane: Plane,
  laptop: Laptop,
  home: Home,
  target: Target,
};

interface GoalWithProgress extends SavingsGoal {
  progress: GoalProgressInfo;
}

interface GoalCardProps {
  goal: GoalWithProgress;
  contributions: GoalContributionEntry[];
  milestones: import("@/types").GoalMilestone[];
  onEdit?: (g: SavingsGoal) => void;
  onDelete?: (id: string) => void;
  onAddContribution?: (goalId: string) => void;
  onEditContribution?: (c: GoalContributionEntry) => void;
  onDeleteContribution?: (id: string) => void;
}

// ── Status helpers ───────────────────────────────────────────────────────────

type GoalStatus = "completed" | "on-track" | "behind" | "overdue";

function getGoalStatus(progress: GoalProgressInfo): GoalStatus {
  if (progress.remaining <= 0) return "completed";
  if (progress.daysRemaining <= 0) return "overdue";
  if (progress.onTrack) return "on-track";
  return "behind";
}

const statusConfig: Record<GoalStatus, { label: string; tone: "success" | "warning" | "destructive" | "default" }> = {
  completed: { label: "Completed", tone: "success" },
  "on-track": { label: "On Track", tone: "success" },
  behind: { label: "Behind", tone: "warning" },
  overdue: { label: "Overdue", tone: "destructive" },
};

// ── Circular progress ────────────────────────────────────────────────────────

function CircularProgress({ pct, size = 100, strokeWidth = 8, gradientId }: { pct: number; size?: number; strokeWidth?: number; gradientId: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth={strokeWidth} />
      <motion.circle
        cx={center} cy={center} r={radius} fill="none"
        stroke={`url(#${gradientId})`} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(217 91% 60%)" />
          <stop offset="100%" stopColor="hsl(159 64% 45%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function GoalCard({
  goal, contributions, milestones, onEdit, onDelete,
  onAddContribution, onEditContribution, onDeleteContribution,
}: GoalCardProps) {
  const { progress } = goal;
  const Icon = iconMap[goal.icon] ?? Target;
  const status = getGoalStatus(progress);
  const cfg = statusConfig[status];
  const isComplete = status === "completed";
  const [showContribs, setShowContribs] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-elegant hover:shadow-elevated transition-all",
        status === "overdue" ? "border-destructive/40" : "border-border",
      )}
    >
      {status === "overdue" && (
        <div className="absolute inset-x-0 top-0 h-1 bg-destructive" aria-hidden />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
            isComplete ? "bg-success/10 text-success" :
            status === "overdue" ? "bg-destructive/10 text-destructive" :
            "bg-primary/10 text-primary",
          )}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold truncate">{goal.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Target {formatNaira(goal.target)}
            </p>
          </div>
        </div>
        <Badge
          className={cn(
            "shrink-0 text-xs",
            cfg.tone === "success" && "bg-success/15 text-success hover:bg-success/15",
            cfg.tone === "warning" && "bg-warning/15 text-warning hover:bg-warning/15",
            cfg.tone === "destructive" && "bg-destructive/15 text-destructive hover:bg-destructive/15",
            cfg.tone === "default" && "bg-muted/30 text-muted-foreground hover:bg-muted/30",
          )}
          variant="secondary"
        >
          {cfg.label}
        </Badge>

        {/* Milestone badges */}
        <div className="flex flex-wrap gap-1 justify-end">
          {milestones
            .filter((m) => m.goalId === goal.id)
            .sort((a, b) => a.pct - b.pct)
            .map((m) => (
              <Badge
                key={m.id}
                variant="outline"
                className="text-[10px] border-primary/40 text-primary"
                title={`${m.pct}% milestone reached`}
              >
                {m.pct}%
              </Badge>
            ))}
        </div>
      </div>

      {/* Body: circular progress + stats */}
      <div className="mt-5 flex items-center gap-5">
        <div className="relative shrink-0">
          <CircularProgress pct={progress.pct} size={96} strokeWidth={7} gradientId={`goalGrad-${goal.id}`} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-lg font-bold leading-none">{progress.pct.toFixed(0)}%</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">saved</span>
          </div>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Saved</span>
            <span className="font-semibold">{formatNaira(progress.saved)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-semibold">{formatNaira(progress.remaining)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Days left</span>
            <span className={cn("font-semibold", progress.daysRemaining <= 0 ? "text-destructive" : "text-foreground")}>
              {progress.daysRemaining <= 0 ? "Overdue" : `${progress.daysRemaining}d`}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Est. completion</span>
            <span className="font-semibold">
              {progress.estimatedCompletion ? formatDate(progress.estimatedCompletion) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly needed / rate footer */}
      <div className="mt-4 rounded-lg border border-border/70 bg-muted/30 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Monthly needed</span>
          <span className="font-semibold">{formatNaira(progress.monthlyNeeded)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-muted-foreground">Current rate</span>
          <span className="font-semibold">{formatNaira(progress.monthlyRate)}/mo</span>
        </div>
      </div>

      {/* Contributions section */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowContribs(!showContribs)}
          className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
        >
          <span>Contributions ({progress.contributionCount})</span>
          <span className="text-[10px]">{showContribs ? "▲" : "▼"}</span>
        </button>

        {showContribs && (
          <div className="mt-2">
            <ContributionHistory
              contributions={contributions}
              goalId={goal.id}
              pageSize={5}
              onEdit={onEditContribution}
              onDelete={onDeleteContribution}
              showSort
              showPagination
              compact
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onAddContribution?.(goal.id)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit?.(goal)}>
          Edit
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => onDelete?.(goal.id)}>
          Delete
        </Button>
      </div>
    </motion.div>
  );
}