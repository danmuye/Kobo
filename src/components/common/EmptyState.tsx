import { memo, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}

export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-label={title}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8" : "py-16 px-4",
        className,
      )}
    >
      <div className={cn(
        "grid place-items-center rounded-[20px] bg-muted/50 mb-4",
        compact ? "h-12 w-12" : "h-16 w-16",
      )}>
        <Icon className={cn(compact ? "h-6 w-6" : "h-8 w-8", "text-muted-foreground")} />
      </div>
      <h2 className={cn("font-display font-semibold text-foreground", compact ? "text-base" : "text-lg")}>{title}</h2>
      {description && (
        <p className={cn("mt-1 text-sm text-muted-foreground max-w-md", compact ? "max-w-xs" : "")}>{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-6 gap-1.5">
          {action.label}
        </Button>
      )}
      {children}
    </motion.div>
  );
});
