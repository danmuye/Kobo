import { useMemo } from "react";
import { X, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Calendar, Tag as TagIcon, Store } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatNaira, formatDate } from "@/lib/format";
import { getMatchingGoalTransactions, calculateGoalMetrics } from "@/services/goal-matching";
import type { Goal, Transaction } from "@/types";
import type { GoalMetrics } from "@/store/finance";

interface GoalTransactionsDrawerProps {
  goal: Goal | null;
  transactions: Transaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function GoalSummary({ goal, metrics }: { goal: Goal; metrics: GoalMetrics }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-lg border bg-muted/20">
      <div className="space-y-0.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Target</span>
        <p className="font-semibold text-sm">{formatNaira(goal.targetAmount)}</p>
      </div>
      <div className="space-y-0.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Saved</span>
        <p className="font-semibold text-sm text-success">{formatNaira(metrics.saved)}</p>
      </div>
      <div className="space-y-0.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Remaining</span>
        <p className="font-semibold text-sm">{formatNaira(metrics.remaining)}</p>
      </div>
      <div className="space-y-0.5 sm:col-span-3">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Progress</span>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(metrics.percentage, 100)}%` }} />
          </div>
          <span className="font-semibold text-xs">{metrics.percentage.toFixed(1)}%</span>
        </div>
      </div>
      <div className="space-y-0.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Days left</span>
        <p className={cn("font-semibold text-sm", metrics.isExpired ? "text-destructive" : "")}>
          {metrics.isExpired ? "Expired" : `${metrics.daysRemaining}d`}
        </p>
      </div>
      <div className="space-y-0.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Est. completion</span>
        <p className="font-semibold text-sm">
          {metrics.estimatedCompletionDate ? formatDate(metrics.estimatedCompletionDate) : "—"}
        </p>
      </div>
      <div className="space-y-0.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Health</span>
        <p className={cn("font-semibold text-sm", metrics.healthScore >= 70 ? "text-success" : metrics.healthScore >= 40 ? "text-warning" : "text-destructive")}>
          {metrics.healthScore}/100
        </p>
      </div>
      <div className="space-y-0.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Avg daily</span>
        <p className="font-semibold text-sm">{formatNaira(metrics.averageDailySaving)}</p>
      </div>
      <div className="space-y-0.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Required daily</span>
        <p className="font-semibold text-sm">{formatNaira(metrics.requiredDailySaving)}</p>
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === "income";
  const isTransfer = tx.type === "transfer";
  const Icon = isTransfer ? ArrowLeftRight : isIncome ? ArrowUpRight : ArrowDownLeft;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/30 transition-colors">
      <div className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
        isIncome ? "bg-success/10 text-success" : isTransfer ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
        <span className="font-medium truncate col-span-2 sm:col-span-3">{tx.description}</span>
        <span className="text-muted-foreground">{formatDate(tx.date)}</span>
        <span className="text-muted-foreground">{tx.category}</span>
        <span className={cn(
          "font-semibold text-right",
          isIncome ? "text-success" : isTransfer ? "text-primary" : "text-destructive",
        )}>
          {isIncome ? "+" : isTransfer ? "" : "-"}{formatNaira(tx.amount)}
        </span>
        {tx.merchant && (
          <span className="text-muted-foreground flex items-center gap-1">
            <Store className="h-3 w-3" /> {tx.merchant}
          </span>
        )}
        <span className="text-muted-foreground">{isTransfer ? `${tx.fromAccount} → ${tx.toAccount}` : tx.account}</span>
        {tx.tags && tx.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 col-span-2 sm:col-span-3">
            {tx.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function GoalTransactionsDrawer({ goal, transactions, open, onOpenChange }: GoalTransactionsDrawerProps) {
  const matchingTxs = useMemo(
    () => goal ? getMatchingGoalTransactions(goal, transactions) : [],
    [goal, transactions],
  );
  const metrics = useMemo(
    () => goal ? calculateGoalMetrics(goal, transactions) : null,
    [goal, transactions],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              {goal?.name ?? "Goal Transactions"}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <ScrollArea className="flex-1 p-4">
          {goal && metrics && <GoalSummary goal={goal} metrics={metrics} />}

          <div className="mt-4 flex items-center justify-between">
            <h4 className="text-sm font-medium">Transactions ({matchingTxs.length})</h4>
          </div>

          <Separator className="my-3" />

          {matchingTxs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No transactions match this goal yet.</p>
              <p className="text-xs mt-1">Transactions assigned to this goal&apos;s categories, accounts, or tags will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matchingTxs.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
