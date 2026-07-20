import { memo } from "react";
import { Check, Trash2, Bell, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notifications";

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const typeStyles: Record<string, string> = {
  success: "bg-success/10 text-success",
  error: "bg-destructive/10 text-destructive",
  warning: "bg-warning/10 text-warning",
  info: "bg-primary/10 text-primary",
};

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export const NotificationItem = memo(function NotificationItem({
  notification: n,
  onMarkRead,
  onDelete,
  compact,
}: NotificationItemProps) {
  const Icon = typeIcon[n.type] ?? Bell;
  return (
    <div
      role="listitem"
      className={cn(
        "group flex items-start gap-3 px-4 py-3 transition hover:bg-accent/50",
        n.read ? "opacity-60" : "",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full",
          typeStyles[n.type],
        )}
        aria-hidden
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight truncate">{n.title}</p>
          {!n.read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive" aria-label="Unread" />
          )}
        </div>
        {n.message && (
          <p
            className={cn(
              "text-xs text-muted-foreground mt-0.5",
              compact ? "line-clamp-1" : "",
            )}
          >
            {n.message}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground/70">
            {formatRelativeTime(n.timestamp)}
          </span>
          <span className="text-[10px] text-muted-foreground/50 capitalize">
            {n.category}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-0.5 shrink-0",
          compact ? "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" : "",
        )}
      >
        {!n.read && (
          <button
            onClick={() => onMarkRead(n.id)}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Mark "${n.title}" as read`}
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
        <button
          onClick={() => onDelete(n.id)}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Delete notification: ${n.title}`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
});
