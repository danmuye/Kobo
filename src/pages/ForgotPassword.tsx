import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet2, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const { resetPassword, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    setError: setFormError,
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    clearError();
    try {
      await resetPassword(data.email);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send reset email. Please try again.";
      setFormError("root", { message });
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background p-4"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, rgba(16, 185, 129, 0.12), transparent 34%), linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--secondary) / 0.6) 100%)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-elegant text-center space-y-4"
        >
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account with that email exists, we have sent a password reset link. Please check your inbox and follow the instructions.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

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
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
            <Wallet2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-xl border border-border bg-card p-6 shadow-elegant space-y-5"
          noValidate
        >
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert" aria-live="polite">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {errors.root && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert" aria-live="polite">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errors.root.message}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-destructive" role="alert">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
