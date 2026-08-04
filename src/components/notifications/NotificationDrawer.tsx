import { memo, useMemo, useState, useEffect, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Trash2, Search, ArrowUpDown, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Drawer, DrawerContent, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { NotificationItem } from "./NotificationItem";
import type { AppNotification, NotificationType } from "@/types/notifications";

type SortOrder = "newest" | "oldest";

const MOBILE_QUERY = "(max-width: 767px)";

function subscribeMobile(cb: () => void) {
  const mql = window.matchMedia?.(MOBILE_QUERY);
  if (!mql || !mql.addEventListener) return () => {};
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

function getMobileSnapshot(): boolean {
  return window.matchMedia?.(MOBILE_QUERY)?.matches ?? false;
}

interface NotificationDrawerProps {
  open: boolean;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onClose?: () => void;
}

export const NotificationDrawer = memo(function NotificationDrawer({
  open,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClearAll,
  onClose,
}: NotificationDrawerProps) {
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    () => false,
  );

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setTypeFilter("all");
      setSortOrder("newest");
    }
  }, [open]);

  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const filtered = useMemo(() => {
    let list = [...notifications];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q),
      );
    }
    if (typeFilter !== "all") {
      list = list.filter((n) => n.type === typeFilter);
    }
    list.sort((a, b) => {
      const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return sortOrder === "newest" ? diff : -diff;
    });
    return list;
  }, [notifications, search, typeFilter, sortOrder]);

  const list = (compact: boolean) => (
    filtered.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" aria-hidden />
        <p className="text-sm text-muted-foreground">
          {search || typeFilter !== "all"
            ? "No notifications match your filters."
            : "No notifications yet"}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Notifications will appear here as you use the app.
        </p>
      </div>
    ) : (
      <ul className="divide-y divide-border">
        {filtered.map((n) => (
          <li key={n.id}>
            <NotificationItem
              notification={n}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
              compact={compact}
            />
          </li>
        ))}
      </ul>
    )
  );

  const filters = (
    <>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="h-8 pl-8 text-xs"
          aria-label="Search notifications"
        />
      </div>

      <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as NotificationType | "all")}>
        <SelectTrigger className="h-8 w-[100px] text-xs" aria-label="Filter by notification type">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All</SelectItem>
          <SelectItem value="success" className="text-xs">Success</SelectItem>
          <SelectItem value="error" className="text-xs">Error</SelectItem>
          <SelectItem value="warning" className="text-xs">Warning</SelectItem>
          <SelectItem value="info" className="text-xs">Info</SelectItem>
        </SelectContent>
      </Select>

      <button
        onClick={() => setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))}
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-md border border-input text-muted-foreground transition",
          "hover:bg-accent hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label={`Sort by ${sortOrder === "newest" ? "oldest" : "newest"}`}
      >
        <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
      </button>
    </>
  );

  const listLabel = filtered.length > 0
    ? `${filtered.length} notification${filtered.length === 1 ? "" : "s"}`
    : "No notifications";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => { if (!v) onClose?.(); }}>
        <DrawerContent className="max-h-[90vh] p-0 pb-[env(safe-area-inset-bottom)]">
          <DrawerTitle className="sr-only">Notifications</DrawerTitle>
          <DrawerDescription className="sr-only">
            Notifications, {unread} unread
          </DrawerDescription>
          <div className="flex max-h-[90vh] flex-col pt-3">
            <div className="flex items-center justify-between gap-2 px-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold whitespace-nowrap">Notifications</span>
                {unread > 0 && (
                  <span
                    className="grid h-5 min-w-[20px] place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground"
                    aria-label={`${unread} unread`}
                  >
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={onMarkAllRead}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Mark all notifications as read"
                    >
                      <CheckCheck className="h-5 w-5" aria-hidden />
                    </button>
                    <button
                      onClick={onClearAll}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Clear all notifications"
                    >
                      <Trash2 className="h-5 w-5" aria-hidden />
                    </button>
                  </>
                )}
                <button
                  onClick={() => onClose?.()}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
              {filters}
            </div>

            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
              style={{ scrollBehavior: "smooth" }}
              role="list"
              aria-label={listLabel}
              aria-live="polite"
              aria-atomic="true"
            >
              {list(false)}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
          className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-2rem)] sm:w-[22rem] lg:w-96 rounded-xl border border-border bg-popover shadow-elegant overflow-hidden origin-top-right"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <span
                  className="grid h-5 min-w-[20px] place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground"
                  aria-label={`${unread} unread`}
                >
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={onMarkAllRead}
                    className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Mark all notifications as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    onClick={onClearAll}
                    className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Clear all notifications"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            {filters}
          </div>

          <div
            className="max-h-[60vh] overflow-y-auto overscroll-contain"
            role="list"
            aria-label={listLabel}
            aria-live="polite"
            aria-atomic="true"
          >
            {list(true)}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});