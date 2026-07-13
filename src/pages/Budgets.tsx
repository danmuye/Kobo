import { useState } from "react";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useFinanceStore, getBudgetRemaining } from "@/store/finance";
import type { Budget } from "@/types";
import { notify } from "@/services/notifications";
import { formatNaira } from "@/lib/format";
import { useBudgetsPage } from "@/features/budgets/hooks";
import type { BudgetFormValues } from "@/features/forms/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFInput, RHFSelect } from "@/features/forms/fields";
import { budgetSchema, createBudgetSchema, type BudgetFormValues, toBudgetPayload } from "@/features/forms/schemas";

const icons = ["food", "transport", "home", "bolt", "play", "bag", "heart", "users", "education", "health"];
const cats = ["Food & Dining", "Transportation", "Rent", "Utilities", "Entertainment", "Shopping", "Healthcare", "Education", "Family Support"];

const empty: Omit<Budget, "id"> = {
  name: "", category: "Food & Dining", icon: "food", amount: 50_000, spent: 0, period: "monthly", startDate: undefined, endDate: undefined,
};

export default function Budgets() {
  const { budgets: budgetsWithProgress, addBudget, updateBudget, deleteBudget } = useBudgetsPage();
  const rawBudgets = useFinanceStore((s) => s.budgets);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState<Budget | null>(null);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BudgetFormValues>({ resolver: zodResolver(budgetSchema), defaultValues: empty });

  const openNew = () => { setEditing(null); form.reset(empty); setOpen(true); };
  const openEdit = (b: Budget) => { setEditing(b); form.reset(b); setOpen(true); };

  const submit = async (values: BudgetFormValues) => {
    setIsSubmitting(true);

    // Run cross-budget overlap check before saving
    const overlapSchema = createBudgetSchema(rawBudgets, editing?.id);
    const result = overlapSchema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        form.setError(path as any, { message: issue.message });
      }
      setIsSubmitting(false);
      return;
    }

    const payload = toBudgetPayload(values);
    if (editing) { updateBudget(editing.id, payload); notify.success("Budget updated", "", "budget"); }
    else { addBudget(payload); notify.success("Budget added", "", "budget"); }
    setIsSubmitting(false);
    setOpen(false);
    form.reset(empty);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        subtitle="Set limits per category and watch your spending in real time."
        action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Budget</Button>}
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {budgetsWithProgress.map((b) => (
          <div key={b.id} className="relative">
            <BudgetCard budget={b} onView={setDetailOpen} />
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <Button size="icon" variant="ghost" onClick={() => openEdit(b)} aria-label="Edit budget">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => { deleteBudget(b.id); notify.success("Budget deleted", "", "budget"); }} aria-label="Delete budget">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { form.reset(empty); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Budget</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="space-y-4 py-2">
              <RHFInput control={form.control} name="name" label="Name" placeholder="e.g. Groceries" />
              <div className="grid grid-cols-2 gap-3">
                <RHFSelect control={form.control} name="category" label="Category" options={cats.map((c) => ({ label: c, value: c }))} />
                <RHFSelect control={form.control} name="icon" label="Icon" options={icons.map((c) => ({ label: c, value: c }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="amount" label="Amount (₦)" type="number" />
                <RHFInput control={form.control} name="spent" label="Spent (₦)" type="number" />
              </div>
              <RHFSelect control={form.control} name="period" label="Period" options={[{ label: "Weekly", value: "weekly" }, { label: "Monthly", value: "monthly" }, { label: "Yearly", value: "yearly" }]} />
              <details className="group rounded-lg border border-border p-3">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground group-open:text-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Custom date range</span>
                  <span className="ml-auto text-xs opacity-60">optional</span>
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <RHFInput control={form.control} name="startDate" label="Start date" type="date" />
                  <RHFInput control={form.control} name="endDate" label="End date" type="date" />
                </div>
              </details>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { form.reset(empty); setEditing(null); setOpen(false); }}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editing ? "Save" : "Create"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailOpen} onOpenChange={(o) => !o && setDetailOpen(null)}>
        <DialogContent>
          {detailOpen && (
            <>
              <DialogHeader><DialogTitle>{detailOpen.name}</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">{detailOpen.category}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Period</span><span className="font-medium capitalize">{detailOpen.period}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span className="font-medium">{formatNaira(detailOpen.amount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Spent</span><span className="font-medium">{formatNaira(detailOpen.spent)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span className="font-medium">{formatNaira(getBudgetRemaining(detailOpen))}</span></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
