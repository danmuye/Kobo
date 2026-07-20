import { useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { initializeBackend, setBackend, isFirebaseAvailable } from "@/services/service-provider";
import { useAuthStore } from "@/store/auth";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/auth/PublicOnlyRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PageSkeleton, AuthSkeleton } from "@/components/ui/PageSkeleton";
import Index from "./pages/Index";
import { useAutoNotifications } from "@/hooks/use-auto-notifications";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Budgets = lazy(() => import("./pages/Budgets"));
const SavingsGoals = lazy(() => import("./pages/SavingsGoals"));
const Debts = lazy(() => import("./pages/Debts"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Wallets = lazy(() => import("./pages/Wallets"));
const Reports = lazy(() => import("./pages/Reports"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function BackendConnector() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && isFirebaseAvailable()) {
      setBackend("firebase", user.uid).catch((err) => {
        console.error("[BackendConnector] Failed to set Firebase backend:", err);
      });
    }
  }, [user]);

  return null;
}

const App = () => {
  useAutoNotifications();
  useSessionTimeout();

  useEffect(() => {
    initializeBackend();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BackendConnector />
        <ThemeProvider>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
              <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route element={<PublicOnlyRoute />}>
                  <Route path="/login" element={<Suspense fallback={<AuthSkeleton />}><Login /></Suspense>} />
                  <Route path="/register" element={<Suspense fallback={<AuthSkeleton />}><Register /></Suspense>} />
                  <Route path="/forgot-password" element={<Suspense fallback={<AuthSkeleton />}><ForgotPassword /></Suspense>} />
                </Route>
                <Route path="/verify-email" element={<Suspense fallback={<AuthSkeleton />}><VerifyEmail /></Suspense>} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Suspense fallback={<PageSkeleton sections={4} />}><Dashboard /></Suspense>} />
                    <Route path="/transactions" element={<Suspense fallback={<PageSkeleton sections={2} />}><Transactions /></Suspense>} />
                    <Route path="/budgets" element={<Suspense fallback={<PageSkeleton sections={3} />}><Budgets /></Suspense>} />
                    <Route path="/goals" element={<Suspense fallback={<PageSkeleton sections={3} />}><SavingsGoals /></Suspense>} />
                    <Route path="/debts" element={<Suspense fallback={<PageSkeleton sections={3} />}><Debts /></Suspense>} />
                    <Route path="/accounts" element={<Suspense fallback={<PageSkeleton sections={2} />}><Accounts /></Suspense>} />
                    <Route path="/wallets" element={<Suspense fallback={<PageSkeleton sections={2} />}><Wallets /></Suspense>} />
                    <Route path="/reports" element={<Suspense fallback={<PageSkeleton sections={5} />}><Reports /></Suspense>} />
                    <Route path="/settings" element={<Suspense fallback={<PageSkeleton sections={3} />}><SettingsPage /></Suspense>} />
                  </Route>
                </Route>
                <Route path="*" element={<Suspense fallback={<PageSkeleton sections={1} />}><NotFound /></Suspense>} />
              </Routes>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}; 

export default App;