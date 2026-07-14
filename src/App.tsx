import { useEffect } from "react";
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
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import { useAutoNotifications } from "@/hooks/use-auto-notifications";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import SavingsGoals from "./pages/SavingsGoals";
import Debts from "./pages/Debts";
import Accounts from "./pages/Accounts";
import Wallets from "./pages/Wallets";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";

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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route element={<PublicOnlyRoute />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/goals" element={<SavingsGoals />} />
                    <Route path="/debts" element={<Debts />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/wallets" element={<Wallets />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}; 

export default App;