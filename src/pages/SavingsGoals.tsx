import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import type { SavingsGoal, GoalContributionEntry } from "@/types";
import { notify } from "@/services/notifications";
import { useGoalsPage } from "@/features/goals/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFInput, RHFSelect } from "@/features/forms/fields";
import { goalSchema, type GoalFormValues, toGoalPayload } from "@/features/forms/schemas";
import { GoalCard } from "@/components/savings/GoalCard";

const iconOptions = ["shield", "plane", "laptop", "home", "target"];
const emptyGoal: GoalFormValues = { name: "", target: 100_000, saved: 0, deadline: "2027-01-01", icon: "target" };

// ── Contribution form initial state ──────────────────────────────────────────

interface ContribForm {
  open: boolean;
  goalId: string;
  editing: GoalContributionEntry | null;
  amount: string;
  date: string;
  note: string;
}

const emptyContrib: ContribForm = {
  open: false, goalId: "", editing: null, amount: "", date: new Date().toISOString().slice(0, 10), note: "",
};

export default function SavingsGoals() {
  const {
    goals: goalsWithProgress, goalContributions, goalMilestones,
    addGoal, updateGoal, deleteGoal,
    addGoalContribution, updateGoalContribution, deleteGoalContribution,
  } = useGoalsPage();

  // ── Goal dialog state ──────────────────────────────────────────────────
  const [goalOpen, setGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<GoalFormValues>({ resolver: zodResolver(goalSchema), defaultValues: emptyGoal });

  // ── Contribution dialog state ──────────────────────────────────────────
  const [contribForm, setContribForm] = useState<ContribForm>(emptyContrib);
  const [contribError, setContribError] = useState("");

  const openNewGoal = () => { setEditingGoal(null); form.reset(emptyGoal); setGoalOpen(true); };
  const openEditGoal = (g: SavingsGoal) => { setEditingGoal(g); form.reset(g); setGoalOpen(true); };

  const submitGoal = async (values: GoalFormValues) => {
    setIsSubmitting(true);
    const payload = toGoalPayload(values);
    if (editingGoal) { updateGoal(editingGoal.id, payload); notify.success("Goal updated", "", "goal"); }
    else { addGoal(payload); notify.success("Goal added", "", "goal"); }
    setIsSubmitting(false);
    setGoalOpen(false);
    form.reset(emptyGoal);
  };

  // ── Contribution handlers ──────────────────────────────────────────────

  const openAddContrib = useCallback((goalId: string) => {
    setContribForm({ ...emptyContrib, open: true, goalId });
    setContribError("");
  }, []);

  const openEditContrib = useCallback((c: GoalContributionEntry) => {
    setContribForm({
      open: true,
      goalId: c.goalId,
      editing: c,
      amount: String(c.amount),
      date: c.date.slice(0, 10),
      note: c.note ?? "",
    });
    setContribError("");
  }, []);

  const submitContrib = () => {
    const amount = Number(contribForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setContribError("Enter a valid positive amount");
      return;
    }

    if (contribForm.editing) {
      updateGoalContribution(contribForm.editing.id, {
        amount,
        date: new Date(contribForm.date).toISOString(),
        note: contribForm.note || undefined,
      });
      notify.success("Contribution updated", "", "goal");
    } else {
      addGoalContribution({
        goalId: contribForm.goalId,
        amount,
        date: new Date(contribForm.date).toISOString(),
        note: contribForm.note || undefined,
      });
      notify.success("Contribution added", "", "goal");
    }

    setContribForm(emptyContrib);
    setContribError("");
  };

  const openDeleteContrib = useCallback((id: string) => {
    deleteGoalContribution(id);
    notify.success("Contribution deleted", "", "goal");
  }, [deleteGoalContribution]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings Goals"
        subtitle="Visualize the future you're saving for."
        action={<Button onClick={openNewGoal}><Plus className="h-4 w-4 mr-1" /> New Goal</Button>}
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {goalsWithProgress.map((g) => {
          const gMilestones = goalMilestones.filter((m) => m.goalId === g.id);
          return (
            <GoalCard
              key={g.id}
              goal={g}
              contributions={goalContributions}
              milestones={gMilestones}
              onEdit={openEditGoal}
              onDelete={(id) => { deleteGoal(id); notify.success("Goal deleted", "", "goal"); }}
              onAddContribution={openAddContrib}
              onEditContribution={openEditContrib}
              onDeleteContribution={openDeleteContrib}
            />
          );
        })}
      </div>

      {/* ── Goal create/edit dialog ── */}
      <Dialog open={goalOpen} onOpenChange={(isOpen) => { setGoalOpen(isOpen); if (!isOpen) { form.reset(emptyGoal); setEditingGoal(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingGoal ? "Edit" : "New"} Savings Goal</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submitGoal)} className="space-y-4 py-2">
              <RHFInput control={form.control} name="name" label="Goal name" />
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="target" label="Target (₦)" type="number" />
                <RHFInput control={form.control} name="saved" label="Saved (₦)" type="number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="deadline" label="Deadline" type="date" />
                <RHFSelect control={form.control} name="icon" label="Icon" options={iconOptions.map((k) => ({ label: k, value: k }))} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { form.reset(emptyGoal); setEditingGoal(null); setGoalOpen(false); }}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editingGoal ? "Save" : "Create"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Contribution add/edit dialog ── */}
      <Dialog open={contribForm.open} onOpenChange={(o) => { if (!o) { setContribForm(emptyContrib); setContribError(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{contribForm.editing ? "Edit" : "Add"} Contribution</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Amount (₦)</label>
              <input
                type="number"
                value={contribForm.amount}
                onChange={(e) => setContribForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring transition"
                placeholder="e.g. 50000"
                min={1}
                step={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Date</label>
              <input
                type="date"
                value={contribForm.date}
                onChange={(e) => setContribForm((prev) => ({ ...prev, date: e.target.value }))}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Note (optional)</label>
              <input
                type="text"
                value={contribForm.note}
                onChange={(e) => setContribForm((prev) => ({ ...prev, note: e.target.value }))}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring transition"
                placeholder="e.g. Salary savings"
              />
            </div>
            {contribError && (
              <p className="text-xs text-destructive">{contribError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setContribForm(emptyContrib); setContribError(""); }}>Cancel</Button>
              <Button type="button" onClick={submitContrib}>
                {contribForm.editing ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}