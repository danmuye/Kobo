import { useMemo, useState, useRef, useEffect, lazy, Suspense } from "react";
import { Link, Outlet } from "react-router-dom";
import { Menu, Moon, Sun, Search, Bell, Plus, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFinanceStore } from "@/store/finance";
import { useNotificationStore } from "@/store/notifications";
import { useTransactionModal } from "@/store/transaction-modal";
import { getNotificationService } from "@/services/service-provider";
import { highlightMatch, searchFinanceData } from "@/features/search/utils";

const NotificationDrawer = lazy(() =>
  import("@/components/notifications/NotificationDrawer").then((m) => ({ default: m.NotificationDrawer })),
);
const TransactionFormDialog = lazy(() =>
  import("@/components/transactions/TransactionFormDialog").then((m) => ({ default: m.TransactionFormDialog })),
);

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const { theme, toggle } = useTheme();
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const accounts = useFinanceStore((s) => s.accounts);
  const goals = useFinanceStore((s) => s.goals);
  const debts = useFinanceStore((s) => s.debts);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);
  const nsvc = getNotificationService();

  const searchResults = useMemo(() => searchFinanceData({ transactions, budgets, accounts, goals, debts }, query), [transactions, budgets, accounts, goals, debts, query]);
  const openTransactionModal = useTransactionModal((s) => s.open);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotifOpen(false);
        bellRef.current?.focus();
      }
    };
    if (notifOpen) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKey);
      return () => {
        document.removeEventListener("mousedown", handleClick);
        document.removeEventListener("keydown", handleKey);
      };
    }
  }, [notifOpen]);

  return (
    <div className="min-h-screen w-full bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-20" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6">
          <button
            className="lg:hidden grid h-9 w-9 place-items-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden md:block flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transactions, budgets, accounts\u2026"
              className="h-10 w-full rounded-lg border border-input bg-secondary/50 pl-9 pr-3 text-sm outline-none focus:border-ring focus:bg-background transition"
              aria-label="Global search"
            />
            {query && (
              <div className="absolute left-0 right-0 top-12 z-40 rounded-xl border border-border bg-popover p-2 shadow-elegant" role="listbox" aria-label="Search results">
                <div className="mb-2 flex items-center justify-between px-2 text-xs text-muted-foreground">
                  <span>{searchResults.length ? "Results" : "No matches"}</span>
                  <button onClick={() => setQuery("")} className="rounded p-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Clear search">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {searchResults.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">Try searching for a transaction, budget, account, savings goal, or debt.</p>
                ) : (
                  <ul className="space-y-1" role="group" aria-label="Suggestions">
                    {searchResults.map((result) => (
                      <li key={`${result.kind}-${result.id}`} role="option">
                        <Link to={result.href} onClick={() => setQuery("")} className="flex items-start justify-between rounded-lg px-2 py-2 hover:bg-accent/70" aria-selected={false}>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {highlightMatch(result.title, query)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{highlightMatch(result.subtitle, query)}</p>
                          </div>
                          <span className="ml-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            {result.kind}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="hidden sm:inline-flex gap-1.5" onClick={() => openTransactionModal("create")}>
              <Plus className="h-4 w-4" /> Add Transaction
            </Button>

            {/* ── Notification Bell ── */}
            <div ref={notifRef} className="relative">
              <button
                ref={bellRef}
                onClick={() => setNotifOpen((v) => !v)}
                className="grid h-9 w-9 place-items-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              <Suspense fallback={null}>
                <NotificationDrawer
                  open={notifOpen}
                  notifications={notifications}
                  onMarkRead={(id) => nsvc.markAsRead(id)}
                  onMarkAllRead={() => nsvc.markAllAsRead()}
                  onDelete={(id) => nsvc.remove(id)}
                  onClearAll={() => nsvc.clearAll()}
                />
              </Suspense>
            </div>

            <button
              onClick={toggle}
              className="grid h-9 w-9 place-items-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </header>

        <main id="main-content" className="p-4 sm:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>

      <Suspense fallback={null}>
        <TransactionFormDialog />
      </Suspense>
    </div>
  );
}


