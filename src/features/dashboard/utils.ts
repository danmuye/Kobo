import type { Transaction } from "@/types";

export type DashboardTransactionFilter = "all" | "income" | "expense" | "transfer";
export type DashboardTransactionSort = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export function filterAndSortTransactions(
  transactions: Transaction[],
  query: string,
  filter: DashboardTransactionFilter,
  sort: DashboardTransactionSort,
) {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = transactions.filter((transaction) => {
    const matchesFilter = filter === "all" || transaction.type === filter;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      transaction.description.toLowerCase().includes(normalizedQuery) ||
      transaction.category.toLowerCase().includes(normalizedQuery) ||
      transaction.account.toLowerCase().includes(normalizedQuery);

    return matchesFilter && matchesQuery;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "amount-desc") return b.amount - a.amount;
    if (sort === "amount-asc") return a.amount - b.amount;
    if (sort === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return sorted;
}

export function paginateTransactions(transactions: Transaction[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(transactions.length / safePageSize));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * safePageSize;
  const end = start + safePageSize;

  return { items: transactions.slice(start, end), totalPages, currentPage };
}
