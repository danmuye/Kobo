import { lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";
import TopNavigation from "./TopNavigation";

const TransactionFormDialog = lazy(() =>
  import("@/components/transactions/TransactionFormDialog").then((m) => ({ default: m.TransactionFormDialog })),
);

export default function AppLayout() {
  return (
    <div className="min-h-screen w-full bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      <TopNavigation />

      <main id="main-content" className="animate-fade-in">
        <Outlet />
      </main>

      <Suspense fallback={null}>
        <TransactionFormDialog />
      </Suspense>
    </div>
  );
}
