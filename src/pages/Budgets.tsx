import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, X, BarChart3, History, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { BudgetInsightsPanel } from "@/components/budgets/BudgetInsightsPanel";
import { BudgetAnalyticsPanel } from "@/components/budgets/BudgetAnalyticsPanel";
import { BudgetHistoryTimeline } from "@/components/budgets/BudgetHistoryTimeline";
import { EmptyBudgetState } from "@/components/budgets/EmptyBudgetState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import type { Budget } from "@/types";
import { notify } from "@/services/notifications";
import { formatNaira, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useBudgetsPage, type BudgetWithDetails } from "@/features/budgets/hooks";
import { useFinanceStore } from "@/store/finance";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFInput, RHFSelect, RHFTextArea } from "@/features/forms/fields";
import { budgetSchema, type BudgetFormValues, toBudgetPayload } from "@/features/forms/schemas";
import { getBudgetCategories, calculateBudgetMetrics, getBudgetStatus, getBudgetInsights, computeBudgetUtilization } from "@/services/budget-matching";

const icons = ["food", "transport", "home", "bolt", "play", "bag", "heart", "users", "education", "health"];
const cats = ["Food & Dining", "Transportation", "Rent", "Utilities", "Entertainment", "Shopping", "Healthcare", "Education", "Family Support"];

const empty: BudgetFormValues = {
  name: "", category: "Food & Dining", icon: "food", amount: 50_000, period: "Monthly", startDate: "", endDate: "", color: "", notes: "", accounts: "", wallets: "", tags: "",
};

function budgetToFormValues(b: Budget): BudgetFormValues {
  return {
    name: b.name,
    category: getBudgetCategories(b)[0] || "",
    icon: b.icon,
    amount: b.amount,
    period: b.period,
    startDate: b.startDate || "",
    endDate: b.endDate || "",
    color: b.color || "",
    notes: b.notes || "",
    accounts: Array.isArray(b.accounts) ? b.accounts.join(", ") : "",
    wallets: Array.isArray(b.wallets) ? b.wallets.join(", ") : "",
    tags: Array.isArray(b.tags) ? b.tags.join(", ") : "",
  };
}

function BudgetOverview({ budget, onClose }: { budget: BudgetWithDetails; onClose: () => void }) {
  const transactions = useFinanceStore((s) => s.transactions);
  const allBudgets = useFinanceStore((s) => s.budgets);
  const allTxns = useFinanceStore((s) => s.transactions);
  const metrics = useMemo(() => calculateBudgetMetrics(budget, transactions), [budget, transactions]);
  const cats = getBudgetCategories(budget);

  const matching = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type === "income" || t.type === "transfer") return false;
      if (cats.length > 0 && !cats.includes(t.category)) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, cats]);

  const summary = useMemo(() => computeBudgetUtilization(allBudgets, allTxns), [allBudgets, allTxns]);

  const utilizationPct = summary.totalBudgeted > 0 ? (summary.totalSpent / summary.totalBudgeted) * 100 : 0;

  return (
    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{budget.name}</DialogTitle>
        <DialogDescription>
          {budget.period} budget &bull; {getBudgetCategories(budget).join(", ") || "No categories"}
          {budget.tags && budget.tags.length > 0 && ` &bull; Tags: ${budget.tags.join(", ")}`}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Budget</p>
          <p className="mt-1 font-display text-lg font-bold">{formatNaira(budget.amount)}</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Spent</p>
          <p className={cn("mt-1 font-display text-lg font-bold", metrics.isOverBudget ? "text-destructive" : "text-foreground")}>{formatNaira(metrics.spent)}</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Remaining</p>
          <p className={cn("mt-1 font-display text-lg font-bold", metrics.remaining < 0 ? "text-destructive" : "text-foreground")}>{formatNaira(Math.max(metrics.remaining, 0))}</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Transactions</p>
          <p className="mt-1 font-display text-lg font-bold">{metrics.transactionCount}</p>
        </div>
      </div>

      {metrics.isOverBudget && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive font-medium text-center">
          Over budget by {formatNaira(metrics.spent - budget.amount)}
        </div>
      )}

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="transactions" className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" /> Transactions
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" /> Insights
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="pt-4">
          <div className="space-y-1">
            {matching.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No matching transactions for this budget period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 font-medium">Account</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matching.map((t) => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                        <td className="py-2 pr-2 text-muted-foreground whitespace-nowrap">{formatDate(t.date)}</td>
                        <td className="py-2 pr-2">
                          <div>
                            <span>{t.description}</span>
                            {t.tags && t.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {t.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2 pr-2"><Badge variant="secondary" className="font-normal text-xs">{t.category}</Badge></td>
                        <td className="py-2 pr-2 text-muted-foreground">{t.account}</td>
                        <td className="py-2 text-right font-medium">{formatNaira(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="pt-4">
          <BudgetInsightsPanel budget={budget} transactions={transactions} />
        </TabsContent>

        <TabsContent value="analytics" className="pt-4">
          <BudgetAnalyticsPanel
            budget={budget}
            transactions={transactions}
            allBudgets={allBudgets}
            allTransactions={allTxns}
          />
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <BudgetHistoryTimeline budget={budget} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}><X className="h-4 w-4 mr-1" /> Close</Button>
      </div>
    </DialogContent>
  );
}

export default function Budgets() {
  const { budgets: budgetsWithDetails, addBudget, updateBudget, deleteBudget, archiveBudgetPeriod } = useBudgetsPage();
  const allBudgets = useFinanceStore((s) => s.budgets);
  const transactions = useFinanceStore((s) => s.transactions);
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<BudgetWithDetails | null>(null);
  const [transactionsOpen, setTransactionsOpen] = useState<BudgetWithDetails | null>(null);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summaryView, setSummaryView] = useState(false);

  const form = useForm<BudgetFormValues>({ resolver: zodResolver(budgetSchema), defaultValues: empty });

  const openNew = () => { setEditing(null); form.reset(empty); setOpen(true); };
  const openEdit = (b: Budget) => { setEditing(b); form.reset(budgetToFormValues(b)); setOpen(true); };

  const submit = async (values: BudgetFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = toBudgetPayload(values);
      if (editing) {
        const merged: Partial<Budget> = { ...payload };
        if (editing.createdAt) merged.createdAt = editing.createdAt;
        await updateBudget(editing.id, merged);
        notify.success("Budget updated", "", "budget");
      } else {
        await addBudget(payload);
        notify.success("Budget added", "", "budget");
      }
      setOpen(false);
      form.reset(empty);
    } catch {
      notify.error("Failed to save budget", "Please try again.", "budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteBudget(deleteConfirm.id);
      notify.success("Budget deleted", "", "budget");
      setDeleteConfirm(null);
    } catch {
      notify.error("Failed to delete budget", "", "budget");
    }
  };

  const handleArchive = useCallback((budget: BudgetWithDetails) => {
    archiveBudgetPeriod(budget, budget.metrics);
    notify.success("Budget period archived", "Historical data saved.", "budget");
  }, [archiveBudgetPeriod]);

  const overallUtilization = useMemo(() => {
    if (allBudgets.length === 0) return null;
    return computeBudgetUtilization(allBudgets, transactions);
  }, [allBudgets, transactions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        subtitle="Set limits per category and watch your spending in real time."
        action={
          <div className="flex items-center gap-2">
            {budgetsWithDetails.length > 0 && (
              <Button variant="outline" onClick={() => setSummaryView((v) => !v)} className="gap-1.5 text-xs">
                <BarChart3 className="h-4 w-4" />
                {summaryView ? "Cards" : "Summary"}
              </Button>
            )}
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Budget</Button>
          </div>
        }
      />

      {overallUtilization && allBudgets.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-elegant">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overall Budget Utilization</p>
                <p className="font-display text-lg font-bold">
                  {overallUtilization.utilization.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Total Budgeted</span>
                <p className="font-semibold">{formatNaira(overallUtilization.totalBudgeted)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Spent</span>
                <p className="font-semibold">{formatNaira(overallUtilization.totalSpent)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Remaining</span>
                <p className="font-semibold">{formatNaira(Math.max(overallUtilization.totalBudgeted - overallUtilization.totalSpent, 0))}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(overallUtilization.utilization, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                overallUtilization.utilization > 100 ? "bg-destructive" : overallUtilization.utilization > 80 ? "bg-warning" : "bg-success",
              )}
            />
          </div>
        </div>
      )}

      {budgetsWithDetails.length === 0 ? (
        <EmptyBudgetState onCreateNew={openNew} />
      ) : summaryView ? (
        <div className="space-y-4">
          {budgetsWithDetails.map((b) => {
            const insights = getBudgetInsights(b, transactions);
            return (
              <div key={b.id} className="rounded-xl border border-border bg-card p-4 shadow-elegant hover:shadow-elevated transition-all">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "grid h-10 w-10 place-items-center rounded-lg",
                      b.metrics.isOverBudget ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
                    )}>
                      <span className="text-lg">{b.icon === "food" ? "🍔" : b.icon === "transport" ? "🚗" : b.icon === "home" ? "🏠" : b.icon === "bolt" ? "⚡" : b.icon === "play" ? "▶️" : b.icon === "bag" ? "🛍️" : b.icon === "heart" ? "❤️" : b.icon === "users" ? "👥" : b.icon === "education" ? "📚" : b.icon === "health" ? "🏥" : "💰"}</span>
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">{b.name}</h3>
                      <p className="text-xs text-muted-foreground">{b.period} &bull; {getBudgetCategories(b).join(", ") || "No categories"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="text-muted-foreground">Budget</span>
                      <p className="font-semibold">{formatNaira(b.amount)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Spent</span>
                      <p className={cn("font-semibold", b.metrics.isOverBudget ? "text-destructive" : "text-foreground")}>{formatNaira(b.metrics.spent)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Remaining</span>
                      <p className={cn("font-semibold", b.metrics.remaining < 0 ? "text-destructive" : "text-foreground")}>{formatNaira(Math.max(b.metrics.remaining, 0))}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">Left</span>
                      <p className="font-semibold">{insights.daysRemaining}d</p>
                    </div>
                    <div className="w-32">
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            b.metrics.percentage > 100 ? "bg-destructive" : b.metrics.percentage > 80 ? "bg-warning" : "bg-success",
                          )}
                          style={{ width: `${Math.min(b.metrics.percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{b.metrics.percentage.toFixed(1)}%</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { const found = budgetsWithDetails.find((x) => x.id === b.id); if (found) setTransactionsOpen(found); }}><span className="text-xs">View</span></Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><span className="text-xs">Edit</span></Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {budgetsWithDetails.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              metrics={b.metrics}
              onView={(budget) => {
                const found = budgetsWithDetails.find((x) => x.id === budget.id);
                if (found) setTransactionsOpen(found as BudgetWithDetails);
              }}
              onEdit={openEdit}
              onDelete={(budget) => {
                const found = budgetsWithDetails.find((x) => x.id === budget.id);
                if (found) setDeleteConfirm(found as BudgetWithDetails);
              }}
            />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { form.reset(empty); setEditing(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Budget</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="space-y-4 py-2">
              <RHFInput control={form.control} name="name" label="Name" placeholder="e.g. Groceries" />
              <div className="grid grid-cols-2 gap-3">
                <RHFSelect control={form.control} name="category" label="Category" options={cats.map((c) => ({ label: c, value: c }))} />
                <RHFSelect control={form.control} name="icon" label="Icon" options={icons.map((c) => ({ label: c, value: c }))} />
              </div>
              <RHFInput control={form.control} name="amount" label="Amount (₦)" type="number" />
              <RHFSelect control={form.control} name="period" label="Period" options={[
                { label: "Weekly", value: "Weekly" }, { label: "Monthly", value: "Monthly" },
                { label: "Yearly", value: "Yearly" }, { label: "Custom", value: "Custom" },
              ]} />
              <details className="group rounded-lg border border-border p-3">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground group-open:text-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Date range &amp; filters</span>
                  <span className="ml-auto text-xs opacity-60">optional</span>
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <RHFInput control={form.control} name="startDate" label="Start date" type="date" />
                  <RHFInput control={form.control} name="endDate" label="End date" type="date" />
                </div>
                <div className="mt-3 space-y-3">
                  <RHFInput control={form.control} name="accounts" label="Accounts (comma-separated)" placeholder="e.g. GTBank, Access" />
                  <RHFInput control={form.control} name="wallets" label="Wallets (comma-separated)" placeholder="e.g. PayPal, Cash" />
                  <RHFInput control={form.control} name="tags" label="Tags (comma-separated)" placeholder="e.g. essential, recurring" />
                </div>
              </details>
              <RHFTextArea control={form.control} name="notes" label="Notes" placeholder="Optional notes..." />
              <RHFInput control={form.control} name="color" label="Color (hex)" placeholder="#3b82f6" />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { form.reset(empty); setEditing(null); setOpen(false); }}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editing ? "Save" : "Create"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Budget</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone. Transactions will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!transactionsOpen} onOpenChange={(o) => { if (!o) setTransactionsOpen(null); }}>
        {transactionsOpen && (
          <BudgetOverview budget={transactionsOpen} onClose={() => setTransactionsOpen(null)} />
        )}
      </Dialog>
    </div>
  );
}
