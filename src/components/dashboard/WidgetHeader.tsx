import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetHeaderProps {
  title: string;
  action?: { label: string; to: string };
  className?: string;
}

export const WidgetHeader = memo(function WidgetHeader({
  title,
  action,
  className,
}: WidgetHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h3 className="font-display font-semibold text-foreground">{title}</h3>
      {action && (
        <Link
          to={action.to}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {action.label}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
});
