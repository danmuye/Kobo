import { useMemo, useState } from "react";
import { useFinanceStore } from "@/store/finance";
import { getFinanceService } from "@/services/service-provider";
import type { Transaction } from "@/types";

export function useTransactionsPage() {
  const transactions = useFinanceStore((s) => s.transactions);
  const accounts = useFinanceStore((s) => s.accounts);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense" | "transfer">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesType = filter === "all" || transaction.type === filter;
      const haystack = [
        transaction.description,
        transaction.category,
        transaction.account,
        transaction.notes ?? "",
        transaction.fromAccount ?? "",
        transaction.toAccount ?? "",
        ...(transaction.attachments ?? []),
      ].join(" ").toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      return matchesType && matchesQuery;
    });
  }, [filter, query, transactions]);

  const svc = getFinanceService();

  return {
    query, setQuery, filter, setFilter, filtered, accounts,
    addTransaction: (data: Omit<Transaction, "id">) => svc.transactions.create(data),
    updateTransaction: (id: string, data: Partial<Transaction>) => svc.transactions.update(id, data),
    deleteTransaction: (id: string) => svc.transactions.delete(id),
  };
}
