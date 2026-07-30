import { useMemo, useState, useRef, useEffect, lazy, Suspense } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Bell, Plus, Moon, Sun, Coins, Menu, LayoutDashboard, ArrowLeftRight, PieChart, Target, CreditCard, Landmark, Wallet, BarChart3, Settings, X } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetTrigger, SheetClose,
} from "@/components/ui/sheet";
import { useFinanceStore } from "@/store/finance";
import { useNotificationStore } from "@/store/notifications";
import { useTransactionModal } from "@/store/transaction-modal";
import { getNotificationService } from "@/services/service-provider";
import { highlightMatch, searchFinanceData } from "@/features/search/utils";
import { useAuthContext } from "@/contexts/auth-context";

const NotificationDrawer = lazy(() =>
  import("@/components/notifications/NotificationDrawer").then((m) => ({ default: m.NotificationDrawer })),
);

const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/budgets", label: "Budgets", icon: PieChart },
  { to: "/goals", label: "Savings", icon: Target },
  { to: "/debts", label: "Debts", icon: CreditCard },
  { to: "/accounts", label: "Accounts", icon: Landmark },
  { to: "/wallets", label: "Wallets", icon: Wallet },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function TopNavigation() {
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { user } = useAuthContext();
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

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.charAt(0).toUpperCase() ?? "?");

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node) && !e.composedPath().includes(bellRef.current!)) {
        setNotifOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setSearchOpen(false);
        setQuery("");
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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    if (query || searchOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [query, searchOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <div className="mx-auto flex h-16 items-center gap-4 lg:gap-6 px-4 sm:px-6 lg:px-8 max-w-[1600px] w-full">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-1">
            <SheetTrigger asChild>
              <button
                className="lg:hidden grid h-9 w-9 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <div className="flex items-center gap-2 mr-2 sm:mr-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 shrink-0">
                <Coins className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-base font-bold text-foreground hidden sm:inline">Kobo</span>
            </div>
            <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto scrollbar-thin" aria-label="Main navigation">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "relative flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <link.icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

        {/* Center: Search */}
        <div ref={searchRef} className="relative flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search transactions, budgets, accounts\u2026"
              className="h-10 w-full rounded-full border border-border bg-muted/50 pl-9 pr-3 text-sm outline-none focus:border-emerald-500/30 focus:bg-background focus:shadow-sm transition"
              aria-label="Global search"
            />
          </div>
          {(query || searchOpen) && (
            <div className="absolute left-0 right-0 top-12 z-40 rounded-2xl border border-border bg-card p-2 shadow-lg" role="listbox" aria-label="Search results">
              <div className="mb-1 flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground">
                <span>{searchResults.length ? "Results" : "No matches"}</span>
                <button onClick={() => { setQuery(""); setSearchOpen(false); }} className="rounded p-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Clear search">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {searchResults.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">Try searching for a transaction, budget, account, savings goal, or debt.</p>
              ) : (
                <ul className="space-y-1" role="group" aria-label="Suggestions">
                  {searchResults.map((result) => (
                    <li key={`${result.kind}-${result.id}`} role="option">
                      <NavLink to={result.href} onClick={() => { setQuery(""); setSearchOpen(false); }} className="flex items-start justify-between rounded-lg px-3 py-2 hover:bg-accent/70" aria-selected={false}>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {highlightMatch(result.title, query)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{highlightMatch(result.subtitle, query)}</p>
                        </div>
                        <span className="ml-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {result.kind}
                        </span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" className="hidden sm:inline-flex gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm" onClick={() => openTransactionModal("create")}>
            <Plus className="h-4 w-4" /> Add
          </Button>

          <button
            onClick={() => openTransactionModal("create")}
            className="sm:hidden grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition"
            aria-label="Add Transaction"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Notification Bell */}
          <div ref={notifRef} className="relative">
            <button
              ref={bellRef}
              onClick={() => setNotifOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
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
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shrink-0">
            {initials}
          </div>
        </div>
      </div>

      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 border-r-border/50">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2.5 px-5 pt-6 pb-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 shrink-0">
              <Coins className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">Kobo</span>
          </div>
          <div className="h-px bg-border/50 mx-5" />
          <nav className="flex-1 overflow-y-auto py-3 px-3" aria-label="Mobile navigation">
            <ul className="space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                const Icon = link.icon;
                return (
                  <li key={link.to}>
                    <SheetClose asChild>
                      <NavLink
                        to={link.to}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors min-h-[44px]",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{link.label}</span>
                      </NavLink>
                    </SheetClose>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="h-px bg-border/50 mx-5" />
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground">Kobo Finance Tracker</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
    </header>
  );
}
