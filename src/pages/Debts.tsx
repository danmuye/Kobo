import { useState, useMemo, useEffect } from "react";
import { Plus, CreditCard, Sparkles, TrendingDown, Archive, BarChart3 } from "lucide-react";
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
import { Form } from "@/components/ui/form";
import { formatNaira, formatDate } from "@/lib/format";
import type { Debt } from "@/types";
import { notify } from "@/services/notifications";
import { useFinanceStore, calculateDebtMetrics } from "@/store/finance";
import { getFinanceService } from "@/services/service-provider";
import { calculateDebtTotals } from "@/services/debt-matching";
import { archiveDebtMetrics, getDebtMonthlySummary } from "@/services/debt-history";
import { calculateDebtInsights } from "@/services/debt-insights";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFInput, RHFSelect, RHFTextArea } from "@/features/forms/fields";
import { debtSchema, type DebtFormValues, toDebtPayload } from "@/features/forms/schemas";
import { DebtCard } from "@/components/debts/DebtCard";
import { DebtPaymentDialog } from "@/components/debts/DebtPaymentDialog";
import { DebtPaymentsDrawer } from "@/components/debts/DebtPaymentsDrawer";
import { DebtAnalyticsDialog } from "@/components/debts/DebtAnalyticsDialog";
import { cn } from "@/lib/utils";

const debtTypeOptions = ["Loan", "Credit Card", "Mortgage", "Personal", "Business", "Other"];
const repaymentTypeOptions = ["Fixed", "Minimum", "Interest Only", "Custom"];
const iconOptions = ["credit-card", "landmark", "building", "circle-dollar-sign", "badge-percent", "receipt", "scroll-text"];

const colorLabels: Record<string, string> = {
  "#ef4444": "Red",
  "#f97316": "Orange",
  "#f59e0b": "Amber",
  "#84cc16": "Lime",
  "#10b981": "Green",
  "#06b6d4": "Cyan",
  "#3b82f6": "Blue",
  "#8b5cf6": "Purple",
  "#ec4899": "Pink",
  "#6b7280": "Gray",
};

const debtColors = Object.keys(colorLabels);

const emptyDebt: DebtFormValues = {
  name: "",
  lender: "",
  originalAmount: 100_000,
  interestRate: 5,
  debtType: "Loan",
  repaymentType: "Fixed",
  minimumPayment: 10_000,
  dueDate: new Date(new Date().getFullYear() + 1, 0, 1).toISOString().slice(0, 10),
  startDate: new Date().toISOString().slice(0, 10),
  categories: "",
  accounts: "",
  wallets: "",
  tags: "",
  color: "#ef4444",
  icon: "credit-card",
  notes: "",
  includeTransfers: false,
};

export default function Debts() {
  const debts = useFinanceStore((s) => s.debts);
  const transactions = useFinanceStore((s) => s.transactions);
  const debtHistory = useFinanceStore((s) => s.debtHistory);
  const addDebtHistory = useFinanceStore((s) => s.addDebtHistory);
  const svc = getFinanceService();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);
  const [viewPaymentsDebt, setViewPaymentsDebt] = useState<Debt | null>(null);
  const [analyticsDebt, setAnalyticsDebt] = useState<Debt | null>(null);
  const [activeTab, setActiveTab] = useState("active");

  const form = useForm<DebtFormValues>({ resolver: zodResolver(debtSchema), defaultValues: emptyDebt });

  const debtsWithMetrics = useMemo(
    () => debts.map((d) => ({ ...d, metrics: calculateDebtMetrics(d, transactions) })),
    [debts, transactions],
  );

  const debtSummary = useMemo(() => calculateDebtTotals(debts, transactions), [debts, transactions]);

  useEffect(() => {
    for (const d of debtsWithMetrics) {
      if (d.metrics.isPaidOff) {
        const alreadyArchived = debtHistory.some((h) => h.debtId === d.id);
        if (!alreadyArchived) {
          const entry = archiveDebtMetrics(d, transactions);
          addDebtHistory(entry);
        }
      }
    }
  }, [debtsWithMetrics, debtHistory, transactions, addDebtHistory]);

  const activeDebts = debtsWithMetrics.filter((d) => !d.metrics.isPaidOff);
  const paidOffDebts = debtsWithMetrics.filter((d) => d.metrics.isPaidOff);

  const openNew = () => { setEditing(null); form.reset(emptyDebt); setOpen(true); };
  const openEdit = (d: Debt) => {
    setEditing(d);
    form.reset({
      name: d.name,
      lender: d.lender,
      originalAmount: d.originalAmount,
      interestRate: d.interestRate,
      debtType: d.debtType,
      repaymentType: d.repaymentType,
      minimumPayment: d.minimumPayment,
      dueDate: d.dueDate.slice(0, 10),
      startDate: d.startDate.slice(0, 10),
      categories: d.categories.join(", "),
      accounts: d.accounts.join(", "),
      wallets: d.wallets.join(", "),
      tags: d.tags.join(", "),
      color: d.color,
      icon: d.icon,
      notes: d.notes,
      includeTransfers: d.includeTransfers,
    });
    setOpen(true);
  };

  const submit = async (values: DebtFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = toDebtPayload(values);
      if (editing) {
        await svc.debts.update(editing.id, payload);
        notify.success("Debt updated", "", "debt");
      } else {
        await svc.debts.create(payload);
        notify.success("Debt added", "", "debt");
      }
      setOpen(false);
      form.reset(emptyDebt);
    } catch {
      notify.error("Failed to save debt", "Please try again.", "debt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!debtToDelete) return;
    try {
      await svc.debts.delete(debtToDelete.id);
      notify.success("Debt deleted", "", "debt");
    } catch {
      notify.error("Failed to delete debt", "", "debt");
    } finally {
      setDebtToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Debts"
        subtitle="Track what you owe — progress calculated entirely from transactions."
        action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Debt</Button>}
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-elegant">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Debt</p>
          <p className="mt-2 font-display text-2xl font-bold">{formatNaira(debtSummary.totalOriginal)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-elegant">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Paid Off</p>
          <p className="mt-2 font-display text-2xl font-bold text-success">{formatNaira(debtSummary.totalPaid)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-elegant">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Monthly Minimum</p>
          <p className="mt-2 font-display text-2xl font-bold">{formatNaira(debtSummary.totalMin)}</p>
        </div>
      </div>

      {debts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted mb-4">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-display font-semibold text-lg">No debts tracked</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Add a debt to start tracking repayment progress automatically from your transactions.
          </p>
          <Button onClick={openNew} className="mt-4"><Plus className="h-4 w-4 mr-1" /> Add Debt</Button>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
            <TabsTrigger value="active">
              Active ({activeDebts.length})
            </TabsTrigger>
            <TabsTrigger value="paid">
              Paid Off ({paidOffDebts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {activeDebts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="h-8 w-8 text-success mb-2" />
                <h2 className="font-display font-semibold text-lg">All debts paid off!</h2>
                <p className="text-sm text-muted-foreground mt-1">Celebrate your debt-free journey.</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {activeDebts.map((d) => (
                  <DebtCard
                    key={d.id}
                    debt={d}
                    onEdit={openEdit}
                    onDelete={(debt) => setDebtToDelete(debt)}
                    onMakePayment={(debt) => setPaymentDebt(debt)}
                    onViewTransactions={(debt) => setViewPaymentsDebt(debt)}
                    onViewAnalytics={(debt) => setAnalyticsDebt(debt)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="paid" className="mt-4">
            {paidOffDebts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Archive className="h-8 w-8 text-muted-foreground mb-2" />
                <h2 className="font-display font-semibold text-lg">No paid-off debts yet</h2>
                <p className="text-sm text-muted-foreground mt-1">Keep making payments — your progress will show here.</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {paidOffDebts.map((d) => (
                  <DebtCard
                    key={d.id}
                    debt={d}
                    onEdit={openEdit}
                    onDelete={(debt) => setDebtToDelete(debt)}
                    onMakePayment={(debt) => setPaymentDebt(debt)}
                    onViewTransactions={(debt) => setViewPaymentsDebt(debt)}
                    onViewAnalytics={(debt) => setAnalyticsDebt(debt)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { form.reset(emptyDebt); setEditing(null); } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Debt</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="name" label="Name" />
                <RHFInput control={form.control} name="lender" label="Lender" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="originalAmount" label="Original amount (₦)" type="number" />
                <RHFSelect control={form.control} name="debtType" label="Type" options={debtTypeOptions.map((k) => ({ label: k, value: k }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <RHFSelect control={form.control} name="repaymentType" label="Repayment" options={repaymentTypeOptions.map((k) => ({ label: k, value: k }))} />
                <RHFInput control={form.control} name="minimumPayment" label="Min payment (₦)" type="number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="interestRate" label="Interest rate (%)" type="number" />
                <RHFInput control={form.control} name="dueDate" label="Due date" type="date" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="startDate" label="Start date" type="date" />
                <RHFInput control={form.control} name="categories" label="Categories (comma-separated)" placeholder="e.g. Utilities, Rent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <RHFInput control={form.control} name="accounts" label="Accounts (comma-separated)" placeholder="e.g. Main, Credit" />
                <RHFInput control={form.control} name="wallets" label="Wallets (comma-separated)" placeholder="e.g. PayPal" />
              </div>
              <RHFInput control={form.control} name="tags" label="Tags (comma-separated)" placeholder="e.g. urgent, high-priority" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Colour</label>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Debt colour">
                    {debtColors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => form.setValue("color", c)}
                        className={`h-7 w-7 rounded-full border-2 transition ${form.watch("color") === c ? "border-foreground scale-110 ring-1 ring-foreground" : "border-transparent hover:border-foreground/30"}`}
                        style={{ backgroundColor: c }}
                        role="radio"
                        aria-checked={form.watch("color") === c}
                        aria-label={colorLabels[c]}
                      />
                    ))}
                  </div>
                </div>
                <RHFSelect control={form.control} name="icon" label="Icon" options={iconOptions.map((k) => ({ label: k, value: k }))} />
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" {...form.register("includeTransfers")} />
                Include transfers
              </label>
              <RHFTextArea control={form.control} name="notes" label="Notes" placeholder="Optional notes" rows={2} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { form.reset(emptyDebt); setEditing(null); setOpen(false); }}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editing ? "Save" : "Add"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DebtPaymentsDrawer
        debt={viewPaymentsDebt}
        transactions={transactions}
        open={viewPaymentsDebt !== null}
        onOpenChange={(o) => { if (!o) setViewPaymentsDebt(null); }}
      />

      <DebtAnalyticsDialog
        debt={analyticsDebt}
        debts={debts}
        transactions={transactions}
        open={analyticsDebt !== null}
        onOpenChange={(o) => { if (!o) setAnalyticsDebt(null); }}
      />

      <DebtPaymentDialog
        debt={paymentDebt}
        open={paymentDebt !== null}
        onOpenChange={(o) => { if (!o) setPaymentDebt(null); }}
      />

      <AlertDialog open={debtToDelete !== null} onOpenChange={(o) => { if (!o) setDebtToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Debt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{debtToDelete?.name}</strong>?
              <br /><br />
              This will only remove the debt record. Your transactions will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Debt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
