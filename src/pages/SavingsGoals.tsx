import { useState, useCallback, useEffect } from "react";
import { Plus, Target, Archive, Sparkles, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/components/ui/form";
import type { Goal } from "@/types";
import { notify } from "@/services/notifications";
import { useGoalsPage } from "@/features/goals/hooks";
import { useFinanceStore } from "@/store/finance";
import { archiveGoalMetrics, type GoalHistoryEntry } from "@/services/goal-insights";
import { formatNaira, formatDate } from "@/lib/format";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFInput, RHFSelect, RHFTextArea } from "@/features/forms/fields";
import { goalSchema, type GoalFormValues, toGoalPayload } from "@/features/forms/schemas";
import { GoalCard } from "@/components/savings/GoalCard";
import { GoalContributionDialog } from "@/components/savings/GoalContributionDialog";
import { GoalTransactionsDrawer } from "@/components/savings/GoalTransactionsDrawer";
import { GoalAnalyticsDialog } from "@/components/savings/GoalAnalyticsDialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const iconOptions = ["shield", "plane", "laptop", "home", "target"];
const fundingOptions = ["Income", "Savings Transfer", "Manual Deposit", "Mixed"];
const priorityOptions = ["low", "medium", "high"];

const emptyGoal: GoalFormValues = {
  name: "",
  targetAmount: 100_000,
  targetDate: new Date(new Date().getFullYear() + 1, 0, 1).toISOString().slice(0, 10),
  startDate: new Date().toISOString().slice(0, 10),
  fundingType: "Mixed",
  categories: "",
  accounts: "",
  wallets: "",
  tags: "",
  color: "#8b5cf6",
  icon: "target",
  priority: "medium",
  notes: "",
  autoTrack: true,
  includeTransfers: false,
};

export default function SavingsGoals() {
  const { goals: goalsWithMetrics, addGoal, updateGoal, deleteGoal, invalidateMetric } = useGoalsPage();
  const transactions = useFinanceStore((s) => s.transactions);
  const goalHistory = useFinanceStore((s) => s.goalHistory);
  const addGoalHistory = useFinanceStore((s) => s.addGoalHistory);

  const [goalOpen, setGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);
  const [drawerGoal, setDrawerGoal] = useState<Goal | null>(null);
  const [analyticsGoal, setAnalyticsGoal] = useState<Goal | null>(null);
  const [activeTab, setActiveTab] = useState("active");

  const form = useForm<GoalFormValues>({ resolver: zodResolver(goalSchema), defaultValues: emptyGoal });

  const openNewGoal = () => { setEditingGoal(null); form.reset(emptyGoal); setGoalOpen(true); };
  const openEditGoal = (g: Goal) => {
    setEditingGoal(g);
    form.reset({
      name: g.name,
      targetAmount: g.targetAmount,
      targetDate: g.targetDate.slice(0, 10),
      startDate: g.startDate.slice(0, 10),
      fundingType: g.fundingType,
      categories: g.categories.join(", "),
      accounts: g.accounts.join(", "),
      wallets: g.wallets.join(", "),
      tags: g.tags.join(", "),
      color: g.color,
      icon: g.icon,
      priority: g.priority,
      notes: g.notes,
      autoTrack: g.autoTrack,
      includeTransfers: g.includeTransfers,
    });
    setGoalOpen(true);
  };

  const submitGoal = async (values: GoalFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = toGoalPayload(values);
      if (editingGoal) {
        await updateGoal(editingGoal.id, payload);
        notify.success("Goal updated", "", "goal");
      } else {
        await addGoal(payload);
        notify.success("Goal added", "", "goal");
      }
      setGoalOpen(false);
      form.reset(emptyGoal);
    } catch {
      notify.error("Failed to save goal", "Please try again.", "goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!goalToDelete) return;
    try {
      await deleteGoal(goalToDelete.id);
      notify.success("Goal deleted", "", "goal");
    } catch {
      notify.error("Failed to delete goal", "", "goal");
    } finally {
      setGoalToDelete(null);
    }
  }, [goalToDelete, deleteGoal]);

  useEffect(() => {
    for (const g of goalsWithMetrics) {
      if (g.metrics.isCompleted) {
        const alreadyArchived = goalHistory.some((h) => h.goalId === g.id);
        if (!alreadyArchived) {
          const entry = archiveGoalMetrics(g, transactions);
          addGoalHistory(entry);
        }
      }
    }
  }, [goalsWithMetrics, goalHistory, transactions, addGoalHistory]);

  const activeGoals = goalsWithMetrics.filter((g) => !g.metrics.isCompleted);
  const completedGoals = goalsWithMetrics.filter((g) => g.metrics.isCompleted);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings Goals"
        subtitle="Track your financial goals — progress calculated from your transactions."
        action={<Button onClick={openNewGoal}><Plus className="h-4 w-4 mr-1" /> New Goal</Button>}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="active">
            Active ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedGoals.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({goalHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg">No active goals</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Create your first savings goal and track progress automatically from your transactions.
              </p>
              <Button onClick={openNewGoal} className="mt-4"><Plus className="h-4 w-4 mr-1" /> Create Goal</Button>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {activeGoals.map((g) => (
                  <GoalCard
                      key={g.id}
                      goal={g}
                      onEdit={openEditGoal}
                      onDelete={(goal) => setGoalToDelete(goal)}
                      onAddContribution={(goal) => setContributionGoal(goal)}
                      onViewTransactions={(goal) => setDrawerGoal(goal)}
                      onViewAnalytics={(goal) => setAnalyticsGoal(goal)}
                    />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-purple-500/10 mb-4">
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="font-display font-semibold text-lg">No completed goals yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Goals will appear here once you reach your savings target. Keep going!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {completedGoals.map((g) => (
                  <GoalCard
                      key={g.id}
                      goal={g}
                      onEdit={openEditGoal}
                      onDelete={(goal) => setGoalToDelete(goal)}
                      onAddContribution={(goal) => setContributionGoal(goal)}
                      onViewTransactions={(goal) => setDrawerGoal(goal)}
                      onViewAnalytics={(goal) => setAnalyticsGoal(goal)}
                    />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {goalHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted mb-4">
                <Archive className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg">No history yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Completed goals will be archived here with their final metrics.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {goalHistory.map((entry) => (
                <div key={entry.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium">{entry.goalName}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Completed {formatDate(entry.completionDate)} &bull; {entry.daysToComplete} days
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 shrink-0">
                      {entry.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Target</span>
                      <span className="font-semibold">{formatNaira(entry.targetAmount)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Saved</span>
                      <span className="font-semibold text-success">{formatNaira(entry.saved)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Monthly avg</span>
                      <span className="font-semibold">{formatNaira(entry.averageMonthlyRate)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Transactions</span>
                      <span className="font-semibold">{entry.transactionCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Goal form dialog */}
      <Dialog open={goalOpen} onOpenChange={(isOpen) => { setGoalOpen(isOpen); if (!isOpen) { form.reset(emptyGoal); setEditingGoal(null); } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingGoal ? "Edit" : "New"} Goal</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submitGoal)} className="space-y-4 py-2">
              <RHFInput control={form.control} name="name" label="Goal name" />
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="targetAmount" label="Target (₦)" type="number" />
                <RHFSelect control={form.control} name="fundingType" label="Funding type" options={fundingOptions.map((k) => ({ label: k, value: k }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="targetDate" label="Target date" type="date" />
                <RHFInput control={form.control} name="startDate" label="Start date" type="date" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="categories" label="Categories (comma-separated)" placeholder="e.g. Salary, Freelance" />
                <RHFInput control={form.control} name="accounts" label="Accounts (comma-separated)" placeholder="e.g. Main, Savings" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="wallets" label="Wallets (comma-separated)" placeholder="e.g. PayPal" />
                <RHFInput control={form.control} name="tags" label="Goal tags (comma-separated)" placeholder="e.g. Vacation, Emergency, Education" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <RHFSelect control={form.control} name="icon" label="Icon" options={iconOptions.map((k) => ({ label: k, value: k }))} />
                <RHFSelect control={form.control} name="priority" label="Priority" options={priorityOptions.map((k) => ({ label: k, value: k }))} />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" {...form.register("autoTrack")} />
                  Auto-track
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" {...form.register("includeTransfers")} />
                  Include transfers
                </label>
              </div>
              <RHFTextArea control={form.control} name="notes" label="Notes" placeholder="Optional notes" rows={2} />
              <RHFInput control={form.control} name="color" label="Color (hex)" type="text" placeholder="#8b5cf6" />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { form.reset(emptyGoal); setEditingGoal(null); setGoalOpen(false); }}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editingGoal ? "Save" : "Create"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={goalToDelete !== null} onOpenChange={(o) => { if (!o) setGoalToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{goalToDelete?.name}</strong>?
              <br /><br />
              This will only remove the goal. Your transactions and savings history will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transactions drawer */}
      <GoalTransactionsDrawer
        goal={drawerGoal}
        transactions={transactions}
        open={drawerGoal !== null}
        onOpenChange={(o) => { if (!o) setDrawerGoal(null); }}
      />

      {/* Analytics dialog */}
      <GoalAnalyticsDialog
        goal={analyticsGoal}
        transactions={transactions}
        open={analyticsGoal !== null}
        onOpenChange={(o) => { if (!o) setAnalyticsGoal(null); }}
      />

      {/* Contribution dialog */}
      <GoalContributionDialog
        goal={contributionGoal}
        open={contributionGoal !== null}
        onOpenChange={(o) => { if (!o) setContributionGoal(null); }}
      />
    </div>
  );
}
