import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";

export default function PublicOnlyRoute() {
  const { isAuthenticated, isInitializing } = useAuthContext();

  if (import.meta.env.DEV) {
    console.log(
      "[PublicOnlyRoute] isInitializing:",
      isInitializing,
      "isAuthenticated:",
      isAuthenticated,
    );
  }

  if (isInitializing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" role="status" aria-label="Authenticating" />
      </main>
    );
  }

  if (isAuthenticated) {
    if (import.meta.env.DEV) {
      console.log("[PublicOnlyRoute] Authenticated — redirecting to /dashboard");
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
