import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Pencil, Trash2, Copy, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Paperclip, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { formatDate, formatNaira } from "@/lib/format";
import type { Transaction } from "@/types";
import { notify } from "@/services/notifications";
import { useTransactionsPage } from "@/features/transactions/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFInput, RHFSelect, RHFTextArea } from "@/features/forms/fields";
import { transactionSchema, type TransactionFormValues, toTransactionPayload } from "@/features/forms/schemas";
import { validateTransfer } from "@/store/finance";

const categories = [
  "Food & Dining", "Transportation", "Rent", "Utilities", "Entertainment",
  "Shopping", "Healthcare", "Education", "Salary", "Freelance", "Investment", "Family Support", "Transfer",
];

type TransactionSort = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "description-asc";

function getDefaultValues(accounts: string[], fallbackType: TransactionFormValues["type"] = "expense") {
  const account = accounts[0] ?? "";
  return {
    date: new Date().toISOString().slice(0, 10),
    description: "",
    category: fallbackType === "transfer" ? "Transfer" : "Food & Dining",
    account,
    fromAccount: account,
    toAccount: accounts[1] ?? "",
    amount: 0,
    type: fallbackType,
    notes: "",
    attachments: [] as string[],
    receiptUrl: "",
  } satisfies TransactionFormValues;
}

function buildValuesFromTransaction(transaction: Transaction, accounts: string[]): TransactionFormValues {
  return {
    date: transaction.date.slice(0, 10),
    description: transaction.description,
    category: transaction.category,
    account: transaction.account ?? "",
    fromAccount: transaction.fromAccount ?? "",
    toAccount: transaction.toAccount ?? "",
    amount: transaction.amount,
    type: transaction.type,
    notes: transaction.notes ?? "",
    attachments: transaction.attachments ?? [],
    receiptUrl: transaction.receiptUrl ?? "",
  };
}

export default function Transactions() {
  const { query, setQuery, filter, setFilter, filtered, accounts, addTransaction, updateTransaction, deleteTransaction } = useTransactionsPage();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sort, setSort] = useState<TransactionSort>("date-desc");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const searchRef = useRef<HTMLInputElement>(null);
  const accountNames = useMemo(() => accounts.map((account) => account.name), [accounts]);
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: getDefaultValues(accountNames),
  });
  const selectedType = form.watch("type");

  useEffect(() => {
    form.reset(getDefaultValues(accountNames));
  }, [accountNames, form]);

  useEffect(() => {
    setPage(1);
  }, [query, filter, sort]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        openNew();
      }
      if (event.key === "/" && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setOpen(false);
        form.reset(getDefaultValues(accountNames));
        setEditing(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [accountNames, form]);

  const sortedTransactions = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case "amount-asc":
        return list.sort((a, b) => a.amount - b.amount);
      case "amount-desc":
        return list.sort((a, b) => b.amount - a.amount);
      case "date-asc":
        return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case "description-asc":
        return list.sort((a, b) => a.description.localeCompare(b.description));
      default:
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleTransactions = sortedTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openNew = () => {
    setEditing(null);
    form.reset(getDefaultValues(accountNames));
    setOpen(true);
  };

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    form.reset(buildValuesFromTransaction(transaction, accountNames));
    setOpen(true);
  };

  const duplicateTransaction = (transaction: Transaction) => {
    setEditing(null);
    form.reset({ ...buildValuesFromTransaction(transaction, accountNames), date: new Date().toISOString().slice(0, 10) });
    setOpen(true);
    notify.success("Transaction ready to duplicate", "", "transaction");
  };

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
    const payload = toTransactionPayload(values);
    if (editing) {
      updateTransaction(editing.id, payload);
      notify.success("Transaction updated", "", "transaction");
    } else {
      addTransaction(payload);
      notify.success("Transaction added", "", "transaction");
    }
    setIsSubmitting(false);
    setOpen(false);
    form.reset(getDefaultValues(accountNames));
    setEditing(null);
  };

  const resetForm = () => {
    form.reset(getDefaultValues(accountNames));
    setEditing(null);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle="Every kobo, accounted for."
        action={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Add Transaction
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-elegant">
        <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transactions…"
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring transition"
              aria-label="Search transactions"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30">
              {(["all", "income", "expense", "transfer"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition ${
                    filter === k ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as TransactionSort)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
              <option value="amount-desc">Highest amount</option>
              <option value="amount-asc">Lowest amount</option>
              <option value="description-asc">Description</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-3">Description</th>
                <th className="text-left font-medium px-5 py-3">Category</th>
                <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Account</th>
                <th className="text-left font-medium px-5 py-3 hidden sm:table-cell">Date</th>
                <th className="text-right font-medium px-5 py-3">Amount</th>
                <th className="text-right font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleTransactions.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/30 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-9 w-9 place-items-center rounded-lg ${t.type === "income" ? "bg-success/10 text-success" : t.type === "transfer" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                        {t.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : t.type === "transfer" ? <ArrowLeftRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <span className="font-medium">{t.description}</span>
                        {t.notes ? <p className="text-xs text-muted-foreground">{t.notes}</p> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><Badge variant="secondary" className="font-normal">{t.category}</Badge></td>
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">
                    {t.type === "transfer" ? `${t.fromAccount ?? ""} → ${t.toAccount ?? ""}` : t.account}
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground">{formatDate(t.date)}</td>
                  <td className={`px-5 py-3 text-right font-semibold ${t.type === "income" ? "text-success" : t.type === "transfer" ? "text-primary" : "text-foreground"}`}>
                    {t.type === "income" ? "+" : t.type === "transfer" ? "↔" : "−"}{formatNaira(t.amount)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => duplicateTransaction(t)} aria-label="Duplicate transaction">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(t)} aria-label="Edit transaction">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { deleteTransaction(t.id); notify.success("Transaction deleted", "", "transaction"); }} aria-label="Delete transaction">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleTransactions.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label="Previous page">
              <span className="text-sm">←</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages} aria-label="Next page">
              <span className="text-sm">→</span>
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { resetForm(); } else { setOpen(true); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Transaction</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <RHFSelect control={form.control} name="type" label="Type" options={[{ label: "Expense", value: "expense" }, { label: "Income", value: "income" }, { label: "Transfer", value: "transfer" }]} />
                <RHFInput control={form.control} name="date" label="Date" type="date" />
              </div>
              <RHFInput control={form.control} name="description" label="Description" placeholder="e.g. Bolt to VI" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <RHFSelect control={form.control} name="category" label="Category" options={categories.map((c) => ({ label: c, value: c }))} />
                {selectedType === "transfer" ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:col-span-2">
                    <RHFSelect control={form.control} name="fromAccount" label="From account" options={accountNames.map((name) => ({ label: name, value: name }))} />
                    <RHFSelect control={form.control} name="toAccount" label="To account" options={accountNames.map((name) => ({ label: name, value: name }))} />
                  </div>
                ) : (
                  <RHFSelect control={form.control} name="account" label="Account" options={accountNames.map((name) => ({ label: name, value: name }))} />
                )}
              </div>
              <RHFInput control={form.control} name="amount" label="Amount (₦)" type="number" />
              <RHFTextArea control={form.control} name="notes" label="Notes" placeholder="Add a quick note for this transaction" />
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
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                Tip: use Ctrl/Cmd + N to create a new transaction, slash to focus search, and Escape to close the form.
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editing ? "Save changes" : "Add transaction"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
