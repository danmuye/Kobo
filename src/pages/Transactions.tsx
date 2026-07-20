import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Pencil, Trash2, Copy, ArrowUpRight, ArrowDownRight, ArrowLeftRight, ReceiptText, Badge as BadgeIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNaira } from "@/lib/format";
import type { Transaction } from "@/types";
import { notify } from "@/services/notifications";
import { useTransactionsPage } from "@/features/transactions/hooks";
import { useTransactionModal } from "@/store/transaction-modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { motion } from "framer-motion";

type TransactionSort = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "description-asc";

export default function Transactions() {
  const { query, setQuery, filter, setFilter, filtered, accounts, deleteTransaction } = useTransactionsPage();
  const [sort, setSort] = useState<TransactionSort>("date-desc");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const searchRef = useRef<HTMLInputElement>(null);
  const openModal = useTransactionModal((s) => s.open);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  useEffect(() => {
    setPage(1);
  }, [query, filter, sort]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        openModal("create");
      }
      if (event.key === "/" && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openModal]);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTransaction(deleteTarget.id);
      notify.success("Transaction deleted", "", "transaction");
    } catch {
      notify.error("Failed to delete transaction", "", "transaction");
    } finally {
      setDeleteTarget(null);
    }
  };

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle="Every kobo, accounted for."
        action={
          <Button onClick={() => openModal("create")}>
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
               className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition"
              aria-label="Search transactions"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30" role="group" aria-label="Filter by transaction type">
              {(["all", "income", "expense", "transfer"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  aria-pressed={filter === k}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    filter === k ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as TransactionSort)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Sort transactions">
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
              {visibleTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    {query || filter !== "all" ? (
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No transactions match your search.</p>
                        <p className="text-xs text-muted-foreground/60">Try adjusting your filters or search terms.</p>
                      </div>
                    ) : (
                      <EmptyState
                        icon={ReceiptText}
                        title="No transactions found"
                        description="Add your first transaction to start tracking your money."
                        action={{ label: "Add Transaction", onClick: () => openModal("create") }}
                        compact
                      />
                    )}
                  </td>
                </tr>
              ) : (
                visibleTransactions.map((t, idx) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.15 }}
                    className="border-t border-border hover:bg-muted/30 transition"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${t.type === "income" ? "bg-success/10 text-success" : t.type === "transfer" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                          {t.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : t.type === "transfer" ? <ArrowLeftRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium">{t.description}</span>
                          {t.merchant && <span className="ml-1.5 text-xs text-muted-foreground">@{t.merchant}</span>}
                          {t.tags && t.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {t.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0 leading-3">{tag}</Badge>
                              ))}
                              {t.tags.length > 3 && (
                                <span className="text-[9px] text-muted-foreground">+{t.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                          {t.notes && <p className="text-xs text-muted-foreground/60 mt-0.5 truncate max-w-[200px]">{t.notes}</p>}
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
                        <Button size="icon" variant="ghost" onClick={() => openModal("duplicate", t)} aria-label="Duplicate transaction">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openModal("edit", t)} aria-label="Edit transaction">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(t)} aria-label="Delete transaction">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {visibleTransactions.length > 0 && (
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
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Transaction"
        description={`Are you sure you want to delete "${deleteTarget?.description || "this transaction"}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
