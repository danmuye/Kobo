import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Paperclip, ReceiptText, Tag, Wallet, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { RHFInput, RHFSelect, RHFTextArea } from "@/features/forms/fields";
import { transactionSchema, type TransactionFormValues, toTransactionPayload } from "@/features/forms/schemas";
import { notify } from "@/services/notifications";
import { useFinanceStore, validateTransfer } from "@/store/finance";
import { getBudgetCategories, calculateBudgetMetrics } from "@/services/budget-matching";
import { formatNaira } from "@/lib/format";
import { useTransactionModal } from "@/store/transaction-modal";
import { getFinanceService } from "@/services/service-provider";
import { getMatchingDebtTransactions } from "@/services/debt-matching";

const categories = [
  "Food & Dining", "Transportation", "Rent", "Utilities", "Entertainment",
  "Shopping", "Healthcare", "Education", "Salary", "Freelance", "Investment", "Family Support", "Transfer",
];

const suggestedTags = [
  "groceries", "utilities", "fuel", "electricity", "water", "school", "medical",
  "essential", "recurring", "one-time", "emergency", "leisure", "transport",
  "rent", "insurance", "subscription", "savings", "investment",
];

const LAST_USED_KEY = "kobo-last-used-transaction-v1";

interface LastUsedValues {
  type: TransactionFormValues["type"];
  category: string;
  account: string;
  tags: string;
}

function loadLastUsed(): LastUsedValues {
  try {
    const raw = localStorage.getItem(LAST_USED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        type: parsed.type || "expense",
        category: parsed.category || "Food & Dining",
        account: parsed.account || "",
        tags: parsed.tags || "",
      };
    }
  } catch { /* noop */ }
  return { type: "expense", category: "Food & Dining", account: "", tags: "" };
}

function saveLastUsed(values: LastUsedValues) {
  try {
    localStorage.setItem(LAST_USED_KEY, JSON.stringify(values));
  } catch { /* noop */ }
}

function buildDefaultValues(accounts: string[]): TransactionFormValues {
  const last = loadLastUsed();
  const firstAccount = accounts[0] ?? "";
  return {
    date: new Date().toISOString().slice(0, 10),
    description: "",
    category: last.type === "transfer" ? "Transfer" : last.category || "Food & Dining",
    account: last.type !== "transfer" ? (last.account || firstAccount) : firstAccount,
    fromAccount: firstAccount,
    toAccount: accounts[1] ?? "",
    amount: 0,
    type: last.type,
    notes: "",
    attachments: [] as string[],
    receiptUrl: "",
    tags: last.tags || "",
    merchant: "",
    budgetId: "",
  } satisfies TransactionFormValues;
}

function buildFromTransaction(tx: Transaction, accounts: string[]): TransactionFormValues {
  return {
    date: tx.date.slice(0, 10),
    description: tx.description,
    category: tx.category,
    account: tx.account ?? "",
    fromAccount: tx.fromAccount ?? "",
    toAccount: tx.toAccount ?? "",
    amount: tx.amount,
    type: tx.type,
    notes: tx.notes ?? "",
    attachments: tx.attachments ?? [],
    receiptUrl: tx.receiptUrl ?? "",
    tags: Array.isArray(tx.tags) ? tx.tags.join(", ") : "",
    merchant: tx.merchant ?? "",
    budgetId: tx.budgetId ?? "",
  };
}

export function TransactionFormDialog() {
  const { isOpen, mode, editingTransaction, close } = useTransactionModal();
  const accounts = useFinanceStore((s) => s.accounts);
  const allTransactions = useFinanceStore((s) => s.transactions);
  const allGoals = useFinanceStore((s) => s.goals);
  const accountNames = useMemo(() => accounts.map((a) => a.name), [accounts]);
  const walletNames = useMemo(
    () => accounts.filter((a) => a.type === "mobile_wallet" || a.type === "cash").map((a) => a.name),
    [accounts],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentTab, setRecentTab] = useState<"tags" | "categories">("tags");
  const svc = getFinanceService();

  const defaultValues = useMemo(
    () => {
      if (mode === "edit" && editingTransaction) {
        return buildFromTransaction(editingTransaction, accountNames);
      }
      if (mode === "duplicate" && editingTransaction) {
        const values = buildFromTransaction(editingTransaction, accountNames);
        return { ...values, date: new Date().toISOString().slice(0, 10) };
      }
      return buildDefaultValues(accountNames);
    },
    [mode, editingTransaction, accountNames],
  );

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues,
  });
  const selectedType = form.watch("type");
  const watchedValues = form.watch();

  const [allocateToGoal, setAllocateToGoal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [contributionAmount, setContributionAmount] = useState(0);

  useEffect(() => {
    if (mode === "edit" && editingTransaction?.goalContributionId) {
      const linkedTx = allTransactions.find((t) => t.id === editingTransaction.goalContributionId);
      if (linkedTx) {
        setAllocateToGoal(true);
        setSelectedGoalId(linkedTx.goalId ?? "");
        setContributionAmount(linkedTx.amount);
      }
    } else if (!isOpen) {
      setAllocateToGoal(false);
      setSelectedGoalId("");
      setContributionAmount(0);
    }
  }, [mode, editingTransaction, allTransactions, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && editingTransaction) {
        form.reset(buildFromTransaction(editingTransaction, accountNames));
      } else if (mode === "duplicate" && editingTransaction) {
        const values = buildFromTransaction(editingTransaction, accountNames);
        form.reset({ ...values, date: new Date().toISOString().slice(0, 10) });
      } else {
        form.reset(buildDefaultValues(accountNames));
      }
    }
  }, [isOpen, mode, editingTransaction, accountNames, form]);

  const recentCategories = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const t of allTransactions) {
      if (!seen.has(t.category)) { seen.add(t.category); result.push(t.category); }
      if (result.length >= 5) break;
    }
    return result;
  }, [allTransactions]);

  const recentAccounts = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const t of allTransactions) {
      const acct = t.type === "transfer" ? t.fromAccount : t.account;
      if (acct && !seen.has(acct)) { seen.add(acct); result.push(acct); }
      if (result.length >= 5) break;
    }
    return result;
  }, [allTransactions]);

  const recentWallets = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const t of allTransactions) {
      const acct = t.type === "transfer" ? t.fromAccount : t.account;
      if (acct && walletNames.includes(acct) && !seen.has(acct)) { seen.add(acct); result.push(acct); }
      if (result.length >= 5) break;
    }
    return result;
  }, [allTransactions, walletNames]);

  const recentTags = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const t of allTransactions) {
      if (t.tags) {
        for (const tag of t.tags) {
          if (!seen.has(tag)) { seen.add(tag); result.push(tag); }
          if (result.length >= 8) break;
        }
      }
      if (result.length >= 8) break;
    }
    return result;
  }, [allTransactions]);

  const submit = async (values: TransactionFormValues) => {
    if (values.type === "transfer") {
      const validation = validateTransfer(values, accounts);
      if (!validation.valid) {
        validation.errors.forEach((msg) => notify.error("Validation error", msg, "transaction"));
        setIsSubmitting(false);
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const payload = toTransactionPayload(values);

      if (mode === "edit" && editingTransaction) {
        await svc.transactions.update(editingTransaction.id, payload);

        const oldContributionId = editingTransaction.goalContributionId;
        const hadAllocation = !!oldContributionId;

        if (hadAllocation && allocateToGoal && selectedGoalId) {
          await svc.transactions.update(oldContributionId!, {
            amount: contributionAmount,
            goalId: selectedGoalId,
          });
        } else if (hadAllocation && !allocateToGoal) {
          await svc.transactions.delete(oldContributionId!);
          await svc.transactions.update(editingTransaction.id, { goalContributionId: null });
        } else if (!hadAllocation && allocateToGoal && selectedGoalId) {
          const contribution = await svc.transactions.create({
            date: new Date(values.date).toISOString(),
            description: `Savings Goal: ${allGoals.find((g) => g.id === selectedGoalId)?.name ?? ""}`,
            category: "Savings Goal",
            account: values.account,
            amount: contributionAmount,
            type: "expense",
            notes: "",
            goalId: selectedGoalId,
          });
          await svc.transactions.update(editingTransaction.id, { goalContributionId: contribution.id });
        }

        notify.success("Transaction updated", "", "transaction");
      } else {
        const created = await svc.transactions.create(payload);
        saveLastUsed({ type: values.type, category: values.category, account: values.account, tags: values.tags });

        if (values.type === "income" && allocateToGoal && selectedGoalId && contributionAmount > 0) {
          const goal = allGoals.find((g) => g.id === selectedGoalId);
          const contribution = await svc.transactions.create({
            date: new Date(values.date).toISOString(),
            description: `Savings Goal: ${goal?.name ?? ""}`,
            category: "Savings Goal",
            account: values.account,
            amount: contributionAmount,
            type: "expense",
            notes: values.notes ?? "",
            goalId: selectedGoalId,
          });
          await svc.transactions.update(created.id, { goalContributionId: contribution.id });
        }

        notify.success("Transaction added", "", "transaction");
      }
      close();
    } catch {
      notify.error("Failed to save transaction", "Please try again.", "transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagSelect = (tag: string) => {
    const current = form.getValues("tags");
    const tags = current ? current.split(",").map((t) => t.trim()).filter(Boolean) : [];
    if (!tags.includes(tag)) tags.push(tag);
    form.setValue("tags", tags.join(", "));
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        form.reset(buildDefaultValues(accountNames));
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, accountNames, form, close]);

  const resetForm = () => {
    form.reset(buildDefaultValues(accountNames));
    close();
  };

  const selectedCategory = form.watch("category");
  const allBudgets = useFinanceStore((s) => s.budgets);
  const allDebts = useFinanceStore((s) => s.debts);

  const matchingDebts = useMemo(() => {
    if (!watchedValues.amount || watchedValues.amount <= 0 || allDebts.length === 0) return [];
    const txSnapshot: Transaction = {
      id: "pending",
      date: watchedValues.date || new Date().toISOString(),
      description: watchedValues.description || "",
      category: watchedValues.category || "",
      account: watchedValues.type === "transfer" ? (watchedValues.fromAccount || "") : (watchedValues.account || ""),
      amount: watchedValues.amount,
      type: watchedValues.type,
      tags: watchedValues.tags ? watchedValues.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      fromAccount: watchedValues.type === "transfer" ? watchedValues.fromAccount : undefined,
      toAccount: watchedValues.type === "transfer" ? watchedValues.toAccount : undefined,
      merchant: watchedValues.merchant || undefined,
    };
    return allDebts.filter((d) => {
      const matching = getMatchingDebtTransactions(d, [txSnapshot]);
      return matching.length > 0;
    });
  }, [watchedValues, allDebts]);

  const budgetOptions = useMemo(() => {
    if (!selectedCategory) return [];
    return allBudgets
      .filter((b) => getBudgetCategories(b).includes(selectedCategory))
      .map((b) => {
        const metrics = calculateBudgetMetrics(b, allTransactions);
        return {
          label: `${b.name} — Remaining: ${formatNaira(metrics.remaining ?? 0)} of ${formatNaira(b.amount ?? 0)}`,
          value: b.id,
        };
      });
  }, [selectedCategory, allBudgets, allTransactions]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit" : mode === "duplicate" ? "Duplicate" : "Add"} Transaction
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <RHFSelect control={form.control} name="type" label="Type" options={[
                { label: "Expense", value: "expense" },
                { label: "Income", value: "income" },
                { label: "Transfer", value: "transfer" },
              ]} />
              <RHFInput control={form.control} name="date" label="Date" type="date" />
            </div>

            <RHFInput control={form.control} name="description" label="Description" placeholder="e.g. Bolt to VI" />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <RHFSelect control={form.control} name="category" label="Category" options={categories.map((c) => ({ label: c, value: c }))} />
                {recentCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[11px] text-muted-foreground self-center">Recent:</span>
                    {recentCategories.map((cat) => (
                      <button key={cat} type="button" onClick={() => form.setValue("category", cat)}
                        className="rounded-full border border-border px-2 py-0.5 text-[11px] hover:bg-muted transition">{cat}</button>
                    ))}
                  </div>
                )}
              </div>
              {selectedType === "transfer" ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:col-span-2">
                  <RHFSelect control={form.control} name="fromAccount" label="From account" options={accountNames.map((name) => ({ label: name, value: name }))} />
                  <RHFSelect control={form.control} name="toAccount" label="To account" options={accountNames.map((name) => ({ label: name, value: name }))} />
                </div>
              ) : (
                <div>
                  <RHFSelect control={form.control} name="account" label="Account" options={accountNames.map((name) => ({ label: name, value: name }))} />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[11px] text-muted-foreground self-center">Recent:</span>
                    <div className="flex flex-wrap gap-1">
                      {recentAccounts.map((acct) => (
                        <button key={acct} type="button" onClick={() => form.setValue("account", acct)}
                          className="rounded-full border border-border px-2 py-0.5 text-[11px] hover:bg-muted transition">{acct}</button>
                      ))}
                    </div>
                  </div>
                  {recentWallets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Wallet className="h-3 w-3 text-muted-foreground self-center" />
                      {recentWallets.map((w) => (
                        <button key={w} type="button" onClick={() => form.setValue("account", w)}
                          className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted transition">{w}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <RHFInput control={form.control} name="amount" label="Amount (₦)" type="number" />

            {selectedType === "expense" && (
              <div>
                <RHFSelect control={form.control} name="budgetId" label="Budget" options={[
                  { label: "No budget", value: "" },
                  ...budgetOptions,
                ]} />
                {budgetOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No budgets match category "{selectedCategory}"
                  </p>
                )}
              </div>
            )}

            {matchingDebts.length > 0 && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <CreditCard className="h-3.5 w-3.5" /> Debt Repayment Detected
                </div>
                <div className="space-y-1.5">
                  {matchingDebts.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-xs">
                      <span className="truncate">{d.name}</span>
                      <span className="font-medium text-muted-foreground">
                        {formatNaira(d.originalAmount)} remaining
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <RHFInput control={form.control} name="merchant" label="Merchant" placeholder="e.g. Shoprite" />
              <RHFInput control={form.control} name="tags" label="Tags (comma-separated)" placeholder="e.g. groceries, essentials" />
            </div>

            {(recentTags.length > 0 || suggestedTags.length > 0) && (
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-medium text-muted-foreground">Tags</span>
                  <div className="flex gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => setRecentTab("tags")}
                      className={`text-[10px] px-2 py-0.5 rounded ${recentTab === "tags" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Recent
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecentTab("categories")}
                      className={`text-[10px] px-2 py-0.5 rounded ${recentTab === "categories" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Suggestions
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(recentTab === "tags" ? recentTags : suggestedTags).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagSelect(tag)}
                      className="rounded-full border border-border/60 px-2.5 py-0.5 text-xs hover:bg-muted transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedType === "income" && allGoals.length > 0 && (
              <div className="rounded-lg border border-border/70 p-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allocateToGoal}
                    onChange={(e) => {
                      setAllocateToGoal(e.target.checked);
                      if (e.target.checked && !selectedGoalId && allGoals.length > 0) {
                        setSelectedGoalId(allGoals[0].id);
                      }
                    }}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm font-medium">Allocate part of this income to a savings goal</span>
                </label>
                {allocateToGoal && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Goal</label>
                      <select
                        value={selectedGoalId}
                        onChange={(e) => setSelectedGoalId(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {allGoals.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Contribution amount</label>
                      <input
                        type="number"
                        min={0}
                        max={form.watch("amount")}
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(Number(e.target.value))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <RHFTextArea control={form.control} name="notes" label="Notes" placeholder="Add a quick note for this transaction" />

            <details className="group rounded-lg border border-border/70 p-3">
              <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground group-open:text-foreground">
                <Paperclip className="h-3.5 w-3.5" />
                <span>Attachments &amp; receipt</span>
                <span className="ml-auto text-[10px] opacity-60">future-ready</span>
              </summary>
              <div className="mt-3 space-y-3">
                <RHFInput control={form.control} name="attachments" label="Attachments" placeholder="invoice.pdf, receipt.jpg" />
                <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ReceiptText className="h-4 w-4" />
                    <span>Receipt upload is a placeholder for now.</span>
                  </div>
                  <Button type="button" variant="outline" onClick={() => notify.info("Receipt upload", "Will be added in a future update.", "system")}>
                    <Paperclip className="mr-2 h-4 w-4" /> Upload receipt
                  </Button>
                </div>
              </div>
            </details>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Tip: Last-used values are remembered.</span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Add transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
