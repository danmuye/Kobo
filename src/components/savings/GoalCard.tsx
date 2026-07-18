import { motion, AnimatePresence } from "framer-motion";
import { Target, Shield, Plane, Laptop, Home, MoreVertical, Eye, Edit3, Trash2, BarChart3, Sparkles, Tag, Heart, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatNaira, formatDate } from "@/lib/format";
import type { Goal } from "@/types";
import type { GoalMetrics, GoalStatusInfo } from "@/store/finance";
import { getGoalStatus } from "@/store/finance";

const iconMap: Record<string, typeof Target> = {
  shield: Shield,
  plane: Plane,
  laptop: Laptop,
  home: Home,
  target: Target,
};

interface GoalWithMetrics extends Goal {
  metrics: GoalMetrics;
}

interface GoalCardProps {
  goal: GoalWithMetrics;
  onEdit?: (g: Goal) => void;
  onDelete?: (g: Goal) => void;
  onAddContribution?: (g: Goal) => void;
  onViewTransactions?: (g: Goal) => void;
  onViewAnalytics?: (g: Goal) => void;
}

const GOAL_TAG_OPTIONS = ["Vacation", "Emergency", "Education", "Business", "Rent", "Car", "House", "Medical", "Wedding", "Investment"];

function HealthIndicator({ score }: { score: number }) {
  const color = score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive";
  return (
    <div className="flex items-center gap-1 text-[11px]" title={`Health score: ${score}/100`}>
      <Heart className={cn("h-3 w-3", color)} fill="currentColor" fillOpacity={score / 100} />
      <span className={cn("font-medium", color)}>{score}</span>
    </div>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct.toFixed(1)}% of target`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="h-full rounded-full relative overflow-hidden"
        style={{ backgroundColor: color }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: "1000px 100%" }} />
      </motion.div>
      {pct > 100 && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct - 100, 30)}%` }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute right-0 top-0 h-full"
          style={{ backgroundColor: color, opacity: 0.5, borderLeft: "2px solid", borderColor: color }}
        />
      )}
    </div>
  );
}

export function GoalCard({ goal, onEdit, onDelete, onAddContribution, onViewTransactions, onViewAnalytics }: GoalCardProps) {
  const { metrics } = goal;
  const Icon = iconMap[goal.icon] ?? Target;
  const statusInfo: GoalStatusInfo = getGoalStatus(metrics.percentage, metrics.isCompleted, metrics.isExpired);
  const { label, tone, value } = statusInfo;

  const toneBg: Record<string, string> = {
    blue: "bg-blue-500/15 text-blue-500 hover:bg-blue-500/15",
    green: "bg-green-500/15 text-green-500 hover:bg-green-500/15",
    amber: "bg-amber-500/15 text-amber-500 hover:bg-amber-500/15",
    purple: "bg-purple-500/15 text-purple-500 hover:bg-purple-500/15",
    destructive: "bg-destructive/15 text-destructive hover:bg-destructive/15",
  };

  const toneColors: Record<string, string> = {
    blue: "hsl(217 91% 60%)",
    green: "hsl(142 71% 45%)",
    amber: "hsl(38 92% 50%)",
    purple: "hsl(271 76% 53%)",
    destructive: "hsl(0 84% 60%)",
  };

  const barColor = toneColors[tone] ?? toneColors.blue;

  const goalTags = goal.tags.filter((t) => GOAL_TAG_OPTIONS.includes(t));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-elegant hover:shadow-elevated transition-all",
        value === "expired" ? "border-destructive/40" : value === "exceeded" || value === "completed" ? "border-purple-500/40" : "border-border",
      )}
    >
      {value === "expired" && <div className="absolute inset-x-0 top-0 h-1 bg-destructive" aria-hidden />}
      {(value === "exceeded" || value === "completed") && <div className="absolute inset-x-0 top-0 h-1 bg-purple-500" aria-hidden />}

      {/* Celebration sparkles for completed goals */}
      <AnimatePresence>
        {value === "completed" && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-3 right-12"
          >
            <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-4">
        <div className={cn(
          "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
          value === "completed" || value === "exceeded" ? "bg-purple-500/10 text-purple-500" :
          value === "expired" ? "bg-destructive/10 text-destructive" :
          value === "behind" ? "bg-amber-500/10 text-amber-500" :
          "bg-primary/10 text-primary",
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display font-semibold truncate">{goal.name}</h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                className={cn("text-xs", toneBg[tone] ?? toneBg.blue)}
                variant="secondary"
              >
                {label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onAddContribution?.(goal)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Contribution
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit?.(goal)}>
                    <Edit3 className="h-4 w-4 mr-2" /> Edit Goal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewTransactions?.(goal)}>
                    <Eye className="h-4 w-4 mr-2" /> View Transactions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewAnalytics?.(goal)}>
                    <BarChart3 className="h-4 w-4 mr-2" /> View Analytics
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete?.(goal)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Goal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {goal.fundingType} &bull; Target {formatNaira(goal.targetAmount)}
          </p>
          {goalTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {goalTags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                  <Tag className="h-2.5 w-2.5 mr-0.5" /> {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Progress</span>
          <div className="flex items-center gap-3">
            <HealthIndicator score={metrics.healthScore} />
            <span>{metrics.percentage.toFixed(1)}%</span>
          </div>
        </div>

        <ProgressBar pct={metrics.percentage} color={barColor} />

        <div className="grid grid-cols-2 gap-3 text-xs">
          <motion.div
            className="rounded-lg border border-border/70 bg-muted/30 p-2.5"
            key={`saved-${metrics.saved}`}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-muted-foreground block">Saved</span>
            <span className="font-semibold text-sm">{formatNaira(metrics.saved)}</span>
          </motion.div>
          <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
            <span className="text-muted-foreground block">Remaining</span>
            <span className="font-semibold text-sm">{formatNaira(metrics.remaining)}</span>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full gap-1.5"
          onClick={() => onAddContribution?.(goal)}
        >
          <Plus className="h-3.5 w-3.5" /> Add Contribution
        </Button>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Days left</span>
            <span className={cn("font-semibold", metrics.isExpired ? "text-destructive" : "text-foreground")}>
              {metrics.isExpired ? "Expired" : `${metrics.daysRemaining}d`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Required daily</span>
            <span className="font-semibold">{formatNaira(metrics.requiredDailySaving)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Avg daily</span>
            <span className="font-semibold">{formatNaira(metrics.averageDailySaving)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Est. completion</span>
            <span className="font-semibold">
              {metrics.estimatedCompletionDate ? formatDate(metrics.estimatedCompletionDate) : "—"}
            </span>
          </div>
          {metrics.completionDate && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-semibold text-success">{formatDate(metrics.completionDate)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Transactions</span>
            <span className="font-semibold">{metrics.transactionCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Monthly avg</span>
            <span className="font-semibold">{formatNaira(metrics.averageMonthlyRate)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
