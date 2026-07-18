import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus, Pencil, Trash2, Landmark, Wallet, Banknote, CreditCard,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar,
  Building, Smartphone, PiggyBank, Target, DollarSign, AlertTriangle,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Form, FormField, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatNaira, formatDate } from "@/lib/format";
import type { Account, AccountType, Transaction } from "@/types";
import { notify } from "@/services/notifications";
import { computeAccountBalance } from "@/services/account-balance";
import { useFinanceStore } from "@/store/finance";
import {
  useAccountsPage,
  useFilteredAccounts,
  useMonthlySummaryMap,
} from "@/features/accounts/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFInput, RHFSelect, RHFTextArea } from "@/features/forms/fields";
import { accountSchema, type AccountFormValues, toAccountPayload } from "@/features/forms/schemas";

const accountTypeLabels: Record<AccountType, string> = {
  bank: "Bank",
  credit_card: "Credit Card",
  mobile_wallet: "Mobile Wallet",
  cash: "Cash",
  investment: "Investment",
};

const typeIcon: Record<AccountType, React.ComponentType<{ className?: string }>> = {
  bank: Landmark,
  credit_card: CreditCard,
  mobile_wallet: Wallet,
  cash: Banknote,
  investment: TrendingUp,
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  landmark: Landmark,
  building: Building,
  wallet: Wallet,
  banknote: Banknote,
  "credit-card": CreditCard,
  smartphone: Smartphone,
  "trending-up": TrendingUp,
  "piggy-bank": PiggyBank,
  target: Target,
  "dollar-sign": DollarSign,
};

const iconOptions = [
  { label: "Landmark", value: "landmark" },
  { label: "Building", value: "building" },
  { label: "Wallet", value: "wallet" },
  { label: "Banknote", value: "banknote" },
  { label: "Credit Card", value: "credit-card" },
  { label: "Smartphone", value: "smartphone" },
  { label: "Trending Up", value: "trending-up" },
  { label: "Piggy Bank", value: "piggy-bank" },
  { label: "Target", value: "target" },
  { label: "Dollar Sign", value: "dollar-sign" },
];

const colorLabels: Record<string, string> = {
  "#10b981": "Green",
  "#3b82f6": "Blue",
  "#8b5cf6": "Purple",
  "#f59e0b": "Amber",
  "#ef4444": "Red",
  "#06b6d4": "Cyan",
  "#84cc16": "Lime",
  "#ec4899": "Pink",
  "#14b8a6": "Teal",
  "#f97316": "Orange",
};

const accountColors = Object.keys(colorLabels);

const empty: Omit<Account, "id"> = {
  name: "", bank: "", type: "bank", balance: 0, currency: "NGN",
  color: "#10b981", icon: "landmark", openingBalance: 0, notes: "",
  createdAt: "", updatedAt: "",
};

const healthConfig = {
  high: { label: "Very Active", color: "text-success", bg: "bg-success/10", icon: TrendingUp },
  medium: { label: "Active", color: "text-primary", bg: "bg-primary/10", icon: Activity },
  low: { label: "Low Activity", color: "text-warning", bg: "bg-warning/10", icon: Activity },
  inactive: { label: "Inactive", color: "text-muted-foreground", bg: "bg-muted/30", icon: AlertTriangle },
};

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Account color">
      {accountColors.map((c) => {
        const label = colorLabels[c] ?? c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`h-7 w-7 rounded-full border-2 transition ${value === c ? "border-foreground scale-110 ring-1 ring-foreground" : "border-transparent hover:border-foreground/30"}`}
            style={{ backgroundColor: c }}
            role="radio"
            aria-checked={value === c}
            aria-label={label}
          />
        );
      })}
    </div>
  );
}

export function AccountsView({ filterType }: { filterType?: AccountType | AccountType[] }) {
  const { summary, accounts, addAccount, updateAccount, deleteAccount } = useAccountsPage();
  const transactions = useFinanceStore((s) => s.transactions);
  const list = useFilteredAccounts(filterType);
  const monthlyMap = useMonthlySummaryMap(summary);
  const balanceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts) {
      map.set(a.id, computeAccountBalance(a, transactions));
    }
    return map;
  }, [accounts, transactions]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Account | null>(null);
  const form = useForm<AccountFormValues>({ resolver: zodResolver(accountSchema), defaultValues: empty });

  const submit = useCallback(async (values: AccountFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = toAccountPayload(values);
      if (editing) {
        await updateAccount(editing.id, payload);
        notify.success("Account updated", "", "account");
      } else {
        await addAccount(payload);
        notify.success("Account added", "", "account");
      }
      setOpen(false);
      form.reset(empty);
      setEditing(null);
    } catch {
      notify.error("Something went wrong", "Please try again.", "account");
    } finally {
      setIsSubmitting(false);
    }
  }, [editing, addAccount, updateAccount, form]);

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    try {
      await deleteAccount(deleteConfirm.id);
      notify.success("Account deleted", "", "account");
    } catch {
      notify.error("Failed to delete account", "Please try again.", "account");
    }
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteAccount]);

  return (
    <>
      <section aria-label="Account overview" className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border bg-card p-4 shadow-elegant">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Balance</p>
          <p className="mt-0.5 font-display text-lg font-bold text-foreground" aria-live="polite">{formatNaira(summary.currentBalance)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-elegant">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Available</p>
          <p className="mt-0.5 font-display text-lg font-bold text-success">{formatNaira(summary.availableBalance)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-elegant">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Income</p>
          <p className="mt-0.5 font-display text-lg font-bold text-success">{formatNaira(summary.totalIncome)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-elegant">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Expenses</p>
          <p className="mt-0.5 font-display text-lg font-bold text-destructive">{formatNaira(summary.totalExpenses)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-elegant">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net Cash Flow</p>
          <p className={`mt-0.5 font-display text-lg font-bold ${summary.netCashFlow >= 0 ? "text-success" : "text-destructive"}`}>
            {summary.netCashFlow >= 0 ? "+" : ""}{formatNaira(summary.netCashFlow)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-elegant">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last Transaction</p>
          <p className="mt-0.5 font-display text-sm font-bold text-muted-foreground">
            {summary.lastTransactionDate ? formatDate(summary.lastTransactionDate) : "—"}
          </p>
        </div>
      </section>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {list.length} {list.length === 1 ? "account" : "accounts"}
        </p>
        <Button onClick={() => { setEditing(null); form.reset({ ...empty, type: (Array.isArray(filterType) ? filterType[0] : filterType) ?? "bank" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16 px-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-muted/50 mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-lg">No accounts yet</h3>
          <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
            {filterType
              ? "No accounts match the current filter. Add a new account to get started."
              : "Add your first account to start tracking your finances."}
          </p>
          <Button className="mt-4" onClick={() => { setEditing(null); form.reset({ ...empty, type: (Array.isArray(filterType) ? filterType[0] : filterType) ?? "bank" }); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Create Account
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => {
            const Icon = iconMap[a.icon] ?? typeIcon[a.type] ?? Landmark;
            const monthEntry = monthlyMap.get(a.name);
            const health = summary.accountHealth.find((h) => h.accountName === a.name);
            const hc = health ? healthConfig[health.activityLevel] : null;
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-5 shadow-elegant hover:shadow-elevated transition relative overflow-hidden"
                role="article" aria-label={`Account: ${a.name}`}>
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10" style={{ backgroundColor: a.color }} />
                <div className="flex items-start justify-between relative">
                  <div className="grid h-12 w-12 place-items-center rounded-xl shadow-md" style={{ backgroundColor: a.color }}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex gap-1" role="group" aria-label="Account actions">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(a); form.reset(a); setOpen(true); }} aria-label={`Edit ${a.name}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteConfirm(a)} aria-label={`Delete ${a.name}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{a.bank} • {accountTypeLabels[a.type]}</p>
                <h3 className="font-display font-semibold mt-0.5">{a.name}</h3>
                <p className="mt-3 font-display text-2xl font-bold">{formatNaira(balanceMap.get(a.id) ?? 0)}</p>
                {a.notes && (
                  <p className="mt-1 text-xs text-muted-foreground truncate">{a.notes}</p>
                )}
                {health && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {hc && (
                      <Badge variant="secondary" className={`gap-1 text-[10px] font-normal ${hc.color} ${hc.bg}`}>
                        <hc.icon className="h-3 w-3" />
                        {hc.label}
                      </Badge>
                    )}
                    {health.growth !== 0 && (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${health.growth > 0 ? "text-success" : "text-destructive"}`}>
                        {health.growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(health.growth).toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
                {monthEntry && (monthEntry.income > 0 || monthEntry.expenses > 0 || monthEntry.net !== 0) && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-3 text-xs text-muted-foreground">
                    {monthEntry.income > 0 && (
                      <span className="flex items-center gap-1 text-success">
                        <ArrowUpRight className="h-3 w-3" />{formatNaira(monthEntry.income)}
                      </span>
                    )}
                    {monthEntry.expenses > 0 && (
                      <span className="flex items-center gap-1 text-destructive">
                        <ArrowDownRight className="h-3 w-3" />{formatNaira(monthEntry.expenses)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{monthEntry.transactionCount}
                    </span>
                  </div>
                )}
                {!monthEntry && list.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">No activity this month</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { form.reset(empty); setEditing(null); } }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Account</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RHFInput control={form.control} name="name" label="Name" />
                <RHFSelect control={form.control} name="type" label="Type" options={[
                  { label: "Bank", value: "bank" },
                  { label: "Credit Card", value: "credit_card" },
                  { label: "Mobile Wallet", value: "mobile_wallet" },
                  { label: "Cash", value: "cash" },
                  { label: "Investment", value: "investment" },
                ]} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RHFInput control={form.control} name="bank" label="Bank / Provider" />
                <RHFInput control={form.control} name="openingBalance" label="Opening Balance (₦)" type="number" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RHFSelect control={form.control} name="icon" label="Icon" options={iconOptions} />
              </div>
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <ColorPicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <RHFTextArea control={form.control} name="notes" label="Notes" placeholder="Optional notes about this account" rows={2} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { form.reset(empty); setEditing(null); setOpen(false); }}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editing ? "Save" : "Add"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
              This action cannot be undone. All transactions linked to this account will remain.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Accounts() {
  return (
    <div className="space-y-6">
      <PageHeader title="Accounts" subtitle="All your bank accounts, cards, wallets, and investments in one place." />
      <AccountsView filterType={["bank", "credit_card", "cash", "investment"]} />
    </div>
  );
}