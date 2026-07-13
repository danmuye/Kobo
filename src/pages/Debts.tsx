import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { formatNaira, formatDate } from "@/lib/format";
import type { Debt } from "@/types";
import { notify } from "@/services/notifications";
import { useDebtsPage } from "@/features/debts/hooks";
import { getDebtPaidPercent } from "@/services/reports";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFInput } from "@/features/forms/fields";
import { debtSchema, type DebtFormValues, toDebtPayload } from "@/features/forms/schemas";

const empty: Omit<Debt, "id"> = {
  name: "", lender: "", balance: 100_000, originalAmount: 200_000, interestRate: 5, minPayment: 10_000, dueDate: "2026-12-31",
};

export default function Debts() {
  const { debts: debtsFromHook, debtSummary, addDebt, updateDebt, deleteDebt } = useDebtsPage();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<DebtFormValues>({ resolver: zodResolver(debtSchema), defaultValues: empty });

  const totalDebt = debtSummary.totalDebt;
  const totalOriginal = debtSummary.totalOriginal;
  const totalMin = debtSummary.totalMin;

  const submit = async (values: DebtFormValues) => {
    setIsSubmitting(true);
    const payload = toDebtPayload(values);
    if (editing) { updateDebt(editing.id, payload); notify.success("Debt updated", "", "debt"); }
    else { addDebt(payload); notify.success("Debt added", "", "debt"); }
    setIsSubmitting(false);
    setOpen(false);
    form.reset(empty);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Debts"
        subtitle="Track what you owe — and your path to freedom."
        action={<Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Debt</Button>}
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-elegant">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Debt</p>
          <p className="mt-2 font-display text-2xl font-bold text-destructive">{formatNaira(totalDebt)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-elegant">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Paid Off</p>
          <p className="mt-2 font-display text-2xl font-bold text-success">{formatNaira(totalOriginal - totalDebt)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-elegant">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Monthly Minimum</p>
          <p className="mt-2 font-display text-2xl font-bold">{formatNaira(totalMin)}</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {debtsFromHook.map((d) => {
          const paidPct = getDebtPaidPercent(d);
          return (
            <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-5 shadow-elegant">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">{d.name}</h3>
                    <p className="text-xs text-muted-foreground">{d.lender} • Due {formatDate(d.dueDate)}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(d); form.reset(d); setOpen(true); }} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { deleteDebt(d.id); notify.success("Debt deleted", "", "debt"); }} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-muted-foreground">Balance</p><p className="font-semibold">{formatNaira(d.balance)}</p></div>
                <div><p className="text-muted-foreground">APR</p><p className="font-semibold">{d.interestRate}%</p></div>
                <div><p className="text-muted-foreground">Min/mo</p><p className="font-semibold">{formatNaira(d.minPayment)}</p></div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div initial={{ width: 0 }} animate={{ width: `${paidPct}%` }} transition={{ duration: 0.8 }} className="h-full gradient-primary" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{paidPct.toFixed(1)}% paid off</p>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { form.reset(empty); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Debt</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="name" label="Name" />
                <RHFInput control={form.control} name="lender" label="Lender" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="balance" label="Balance (₦)" type="number" />
                <RHFInput control={form.control} name="originalAmount" label="Original (₦)" type="number" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <RHFInput control={form.control} name="interestRate" label="Interest %" type="number" />
                <RHFInput control={form.control} name="minPayment" label="Min payment" type="number" />
                <RHFInput control={form.control} name="dueDate" label="Due date" type="date" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { form.reset(empty); setEditing(null); setOpen(false); }}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editing ? "Save" : "Add"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
