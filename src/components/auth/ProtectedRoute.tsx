import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";

export default function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuthContext();

  if (import.meta.env.DEV) {
    console.log(
      "[ProtectedRoute] isInitializing:",
      isInitializing,
      "isAuthenticated:",
      isAuthenticated,
    );
  }

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (import.meta.env.DEV) {
      console.log("[ProtectedRoute] Not authenticated — redirecting to /login");
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
