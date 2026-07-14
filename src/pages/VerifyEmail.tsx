import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet2, Mail, AlertCircle, CheckCircle2, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function VerifyEmail() {
  const { user, isAuthenticated, isInitializing, isLoading, sendEmailVerification } = useAuth();
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.emailVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleResend = async () => {
    setResendError(null);
    try {
      await sendEmailVerification();
      setResent(true);
    } catch {
      setResendError("Failed to send verification email. Please try again.");
    }
  };

  const handleCheckVerification = () => {
    setChecking(true);
    window.location.reload();
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(16, 185, 129, 0.12), transparent 34%), linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--secondary) / 0.6) 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-xl border border-border bg-card p-8 shadow-elegant text-center space-y-5">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">Verify your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a verification email to{" "}
              <span className="font-medium text-foreground">{user?.email ?? "your email"}</span>.
              Click the link in the email to activate your account.
            </p>
          </div>

          {resent && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Verification email sent. Check your inbox.</span>
            </div>
          )}

          {resendError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{resendError}</span>
            </div>
          )}

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleResend}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Resend verification email
            </Button>

            <Button className="w-full gap-2" onClick={handleCheckVerification} disabled={checking}>
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              I&apos;ve verified my email
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or try a different email address.{" "}
            <Link to="/login" className="text-foreground hover:text-primary transition">
              Sign out
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
