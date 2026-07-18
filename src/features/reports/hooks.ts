import { useMemo, useState, useCallback } from "react";
import { useFinanceStore } from "@/store/finance";
import {
  computeReport, getDateRange, filterByDateRange, filterTransactions,
  computeComparison, getPeriodLabel, computeFinancialInsights,
  type DateRangePreset, type DateRange, type ReportResult, type ComparisonResult,
  type FinancialInsights,
} from "@/services/reports";
import {
  exportToCsv, exportToExcel, exportToPdf, type ExportFormat,
} from "@/services/export";
import type { Transaction, TransactionType } from "@/types";

export interface FilterState {
  categories: string[];
  accounts: string[];
  budgetIds: string[];
  types: TransactionType[];
}

export function useReportsPage() {
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const goals = useFinanceStore((s) => s.goals);
  const debts = useFinanceStore((s) => s.debts);
  const accounts = useFinanceStore((s) => s.accounts);

  // ── Date range ──
  const [preset, setPreset] = useState<DateRangePreset>("year");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const range = useMemo(
    () => getDateRange(preset, customStart, customEnd),
    [preset, customStart, customEnd],
  );

  const setRangePreset = useCallback((p: DateRangePreset) => {
    setPreset(p);
    if (p !== "custom") {
      setCustomStart(undefined);
      setCustomEnd(undefined);
    }
  }, []);

  const setCustomRange = useCallback((start: string, end: string) => {
    setPreset("custom");
    setCustomStart(start);
    setCustomEnd(end);
  }, []);

  // ── Filters ──
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    accounts: [],
    budgetIds: [],
    types: [],
  });

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ categories: [], accounts: [], budgetIds: [], types: [] });
  }, []);

  // ── Filter options (derived from data) ──
  const filterOptions = useMemo(() => {
    const categorySet = new Set(transactions.map((t) => t.category));
    const accountSet = new Set(transactions.map((t) => t.account));
    return {
      categories: Array.from(categorySet).sort(),
      accounts: Array.from(accountSet).sort(),
      budgets: budgets.map((b) => ({ id: b.id, name: b.name })),
      types: ["income", "expense", "transfer"] as const,
    };
  }, [transactions, budgets]);

  // ── Filtered data (date range + category/account/type) ──
  const dateFilteredTransactions = useMemo(
    () => filterByDateRange(transactions, range),
    [transactions, range],
  );

  const filteredTransactions = useMemo(
    () => filterTransactions(dateFilteredTransactions, {
      categories: filters.categories.length > 0 ? filters.categories : undefined,
      accounts: filters.accounts.length > 0 ? filters.accounts : undefined,
      types: filters.types.length > 0 ? filters.types : undefined,
    }),
    [dateFilteredTransactions, filters.categories, filters.accounts, filters.types],
  );

  // ── Filtered budgets ──
  const filteredBudgets = useMemo(
    () => filters.budgetIds.length > 0
      ? budgets.filter((b) => filters.budgetIds.includes(b.id))
      : budgets,
    [budgets, filters.budgetIds],
  );

  // ── Report ──
  const report: ReportResult = useMemo(
    () => computeReport(
      {
        transactions: filteredTransactions,
        budgets: filteredBudgets,
        goals,
        debts,
        accounts,
      },
      range,
    ),
    [filteredTransactions, filteredBudgets, goals, debts, accounts, range],
  );

  // ── Financial Insights ──
  const insights: FinancialInsights = useMemo(
    () => computeFinancialInsights(
      filteredTransactions,
      filteredBudgets,
      goals,
      debts,
      range,
    ),
    [filteredTransactions, filteredBudgets, goals, debts, range],
  );

  // ── Comparison ──
  const [comparisonMode, setComparisonMode] = useState(false);

  const comparison = useMemo(
    (): ComparisonResult | null =>
      comparisonMode ? computeComparison({ transactions: filteredTransactions }, range) : null,
    [comparisonMode, filteredTransactions, range],
  );

  const toggleComparison = useCallback(() => {
    setComparisonMode((prev) => !prev);
  }, []);

  // ── Export ──
  const exportMeta = useMemo(() => {
    const activeFilters: string[] = [];
    if (filters.categories.length > 0) activeFilters.push(`Categories: ${filters.categories.join(", ")}`);
    if (filters.accounts.length > 0) activeFilters.push(`Accounts: ${filters.accounts.join(", ")}`);
    if (filters.types.length > 0) activeFilters.push(`Types: ${filters.types.join(", ")}`);
    if (filters.budgetIds.length > 0) activeFilters.push(`Budgets: ${filters.budgetIds.length} selected`);

    return {
      title: "Kobo Finance Report",
      dateRange: `${range.start} to ${range.end}`,
      filters: activeFilters,
    };
  }, [filters, range]);

  const exportReport = useCallback(
    (format: ExportFormat) => {
      const fns = { csv: exportToCsv, excel: exportToExcel, pdf: exportToPdf };
      fns[format](filteredTransactions, exportMeta);
    },
    [filteredTransactions, exportMeta],
  );

  return {
    report,
    insights,
    preset, setRangePreset, customStart, customEnd, setCustomRange, range,
    filters, setFilter, clearFilters, filterOptions,
    filteredTransactions,
    comparison, comparisonMode, toggleComparison,
    exportReport,
  };
}
