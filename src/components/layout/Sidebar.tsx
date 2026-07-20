import { memo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target, CreditCard,
  Wallet, Landmark, BarChart3, Settings, ChevronLeft, Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/budgets", label: "Budgets", icon: PieChart },
  { to: "/goals", label: "Savings Goals", icon: Target },
  { to: "/debts", label: "Debts", icon: CreditCard },
  { to: "/accounts", label: "Accounts", icon: Landmark },
  { to: "/wallets", label: "Wallets", icon: Wallet },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const Sidebar = memo(function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const { pathname } = useLocation();
  const { user } = useAuthContext();

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.charAt(0).toUpperCase() ?? "?");

  const displayName = user?.displayName ?? user?.email ?? "User";

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground",
          "border-r border-sidebar-border transition-all duration-300 ease-out",
          collapsed ? "lg:w-20" : "lg:w-64",
          "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg gradient-primary shadow-glow">
              <Coins className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="font-display text-base font-bold leading-none text-sidebar-accent-foreground">
                  Kobo
                </p>
                <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
                  Finance
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="hidden lg:grid h-8 w-8 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onMobileClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-2",
                )}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary"
                  />
                )}
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className={cn("border-t border-sidebar-border p-4", collapsed && "px-2")}>
          {collapsed ? (
            <div className="grid h-9 w-9 place-items-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold mx-auto">
              {initials}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{displayName}</p>
                <p className="truncate text-xs text-sidebar-foreground/60">Free Plan</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
});
