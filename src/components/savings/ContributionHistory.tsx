import { useState, useMemo } from "react";
import { ArrowDown, ArrowUp, Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira, formatDate } from "@/lib/format";
import type { GoalContributionEntry } from "@/types";

// ── Sort types ───────────────────────────────────────────────────────────────

export type ContributionSort = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

interface SortOption {
  value: ContributionSort;
  label: string;
}

const sortOptions: SortOption[] = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "amount-desc", label: "Highest first" },
  { value: "amount-asc", label: "Lowest first" },
];

// ── Component props ──────────────────────────────────────────────────────────

export interface ContributionHistoryProps {
  /** All contributions (will be filtered to the target goalId). */
  contributions: GoalContributionEntry[];
  /** Which goal's contributions to show. */
  goalId: string;
  /** Number of contributions per page. Default 5. */
  pageSize?: number;
  /** Called when the user wants to edit a contribution. */
  onEdit?: (c: GoalContributionEntry) => void;
  /** Called when the user wants to delete a contribution. */
  onDelete?: (id: string) => void;
  /** If true, show the search/filter input. Default false. */
  showSearch?: boolean;
  /** If true, show sort controls. Default true. */
  showSort?: boolean;
  /** If true, show pagination. Default true. */
  showPagination?: boolean;
  /** If true, compact layout for embedding inside cards. Default true. */
  compact?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ContributionHistory({
  contributions,
  goalId,
  pageSize = 5,
  onEdit,
  onDelete,
  showSearch = false,
  showSort = true,
  showPagination = true,
  compact = true,
}: ContributionHistoryProps) {
  const [sort, setSort] = useState<ContributionSort>("date-desc");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Filter to this goal only
  const goalContribs = useMemo(
    () => contributions.filter((c) => c.goalId === goalId),
    [contributions, goalId],
  );

  // Text search across note & amount
  const filtered = useMemo(() => {
    if (!query.trim()) return goalContribs;
    const q = query.trim().toLowerCase();
    return goalContribs.filter((c) => {
      const noteMatch = c.note?.toLowerCase().includes(q) ?? false;
      const amountMatch = String(c.amount).includes(q);
      return noteMatch || amountMatch;
    });
  }, [goalContribs, query]);

  // Sort
  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case "date-asc":
        return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case "amount-desc":
        return list.sort((a, b) => b.amount - a.amount);
      case "amount-asc":
        return list.sort((a, b) => a.amount - b.amount);
      default:
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }, [filtered, sort]);

  // Running total
  const runningTotals = useMemo(() => {
    // Compute running total from oldest to newest for cumulative display
    const sortedAsc = [...sorted].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let running = 0;
    const map = new Map<string, number>();
    for (const c of sortedAsc) {
      running += c.amount;
      map.set(c.id, running);
    }
    return map;
  }, [sorted]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const SortIcon = sort === "date-asc" || sort === "amount-asc" ? ArrowUp : ArrowDown;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Controls row */}
      <div className={cn("flex items-center gap-2", compact ? "flex-col sm:flex-row" : "flex-row flex-wrap")}>
        {showSearch && (
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search contributions…"
              className={cn(
                "w-full rounded-lg border border-input bg-background pl-8 pr-3 outline-none focus:border-ring transition",
                compact ? "h-8 text-xs" : "h-9 text-sm",
              )}
              aria-label="Search contributions"
            />
          </div>
        )}

        {showSort && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                const idx = sortOptions.findIndex((o) => o.value === sort);
                setSort(sortOptions[(idx + 1) % sortOptions.length].value);
                setPage(1);
              }}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border border-input bg-background px-2.5 font-medium text-muted-foreground hover:text-foreground transition",
                compact ? "h-8 text-xs" : "h-9 text-sm",
              )}
              aria-label={`Sort by ${sort}`}
            >
              <SortIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{sortOptions.find((o) => o.value === sort)?.label}</span>
            </button>
          </div>
        )}
      </div>

      {/* Contribution list */}
      <div className={cn("space-y-1", compact && "max-h-48 overflow-y-auto")}>
        {paginated.length === 0 && (
          <p className="text-xs text-muted-foreground py-3 text-center">
            {query ? "No contributions match your search." : "No contributions yet."}
          </p>
        )}
        {paginated.map((c, idx) => {
          const runningTotal = runningTotals.get(c.id) ?? 0;
          return (
            <div
              key={c.id}
              className={cn(
                "flex items-center justify-between rounded-md transition",
                compact ? "bg-muted/10 px-3 py-1.5" : "bg-card border border-border px-4 py-2.5",
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-semibold shrink-0 text-xs sm:text-sm">{formatNaira(c.amount)}</span>
                <span className="text-muted-foreground text-xs">{formatDate(c.date)}</span>
                {c.note && (
                  <span className="text-muted-foreground text-xs truncate italic hidden sm:inline">— {c.note}</span>
                )}
                {!compact && (
                  <span className="text-[10px] text-muted-foreground/60 ml-auto shrink-0">
                    Running: {formatNaira(runningTotal)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0 ml-2">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(c)}
                    className="p-1 text-muted-foreground hover:text-foreground transition"
                    aria-label="Edit contribution"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(c.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition"
                    aria-label="Delete contribution"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-40 transition"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-40 transition"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      {sorted.length > 0 && (
        <p className={cn("text-muted-foreground/60", compact ? "text-[10px]" : "text-xs")}>
          {sorted.length} contribution{sorted.length !== 1 ? "s" : ""} · Total: {formatNaira(sorted.reduce((s, c) => s + c.amount, 0))}
        </p>
      )}
    </div>
  );
}