import { memo } from "react";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export const QuickActionCard = memo(function QuickActionCard({
  icon: Icon,
  label,
  onClick,
  variant = "secondary",
}: QuickActionCardProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === "primary"
          ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/30"
          : "border-border bg-card text-foreground hover:bg-accent hover:border-border",
      )}
      aria-label={label}
    >
      <div className={cn(
        "grid h-9 w-9 place-items-center rounded-lg",
        variant === "primary"
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground",
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="hidden md:inline">{label}</span>
    </motion.button>
  );
});
