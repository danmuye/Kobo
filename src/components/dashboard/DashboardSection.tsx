import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  children: ReactNode;
  className?: string;
}

export const DashboardSection = memo(function DashboardSection({
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5 shadow-elegant", className)}>
      {children}
    </section>
  );
});
