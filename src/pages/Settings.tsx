import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, Monitor, Download, Upload, RotateCcw, Trash2, AlertTriangle, FileWarning, User, KeyRound, Mail, ShieldAlert, LogOut, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { notify } from "@/services/notifications";
import { useFinanceStore } from "@/store/finance";
import { useNotificationStore } from "@/store/notifications";
import { useSettingsStore } from "@/store/settings";
import { useTheme } from "@/components/theme-provider";
import { useSettings } from "@/features/settings/hooks";
import { useAuthContext } from "@/contexts/auth-context";
import { useAuth } from "@/hooks/use-auth";
import { CURRENCIES, getCurrencyDef, formatCurrency } from "@/lib/currency";
import { exportBackupData, downloadBackup, readBackupFile, deduplicateById } from "@/services/backup";

import type { ThemeMode, DateFormatStyle, NumberFormatStyle, TimeFormatStyle } from "@/store/settings";
import type { NotificationPreferenceKey } from "@/types/notifications";

interface PrefDef {
  key: NotificationPreferenceKey;
  label: string;
  description: string;
}

const prefDefs: PrefDef[] = [
  { key: "budgetAlerts", label: "Budget alerts", description: "Get notified when you reach 80%, 95%, or exceed your budget." },
  { key: "savingsAlerts", label: "Savings alerts", description: "Contribution confirmations, milestone celebrations, deadlines, and stalled progress." },
  { key: "debtReminders", label: "Debt reminders", description: "Due-soon warnings, overdue alerts, and paid-off celebrations." },
  { key: "accountAlerts", label: "Account alerts", description: "Negative balance warnings and low balance notifications." },
  { key: "largeTransactionAlerts", label: "Large transaction alerts", description: "Large expenses, large income, and transfer confirmations." },
  { key: "monthlySummaries", label: "Monthly summaries", description: "A periodic roundup of your financial activity." },
];

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const dateFormatOptions: { value: DateFormatStyle; label: string; example: string }[] = [
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY", example: "Jul 10, 2026" },
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY", example: "10 Jul 2026" },
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD", example: "2026-07-10" },
];

const numberFormatOptions: { value: NumberFormatStyle; label: string; example: string }[] = [
  { value: "1,234.56", label: "1,234.56", example: "12,345.67" },
  { value: "1 234,56", label: "1 234,56", example: "12 345,67" },
  { value: "1.234,56", label: "1.234,56", example: "12.345,67" },
];

const timeFormatOptions: { value: TimeFormatStyle; label: string; example: string }[] = [
  { value: "12h", label: "12-hour", example: "2:30 PM" },
  { value: "24h", label: "24-hour", example: "14:30" },
];

export default function Settings() {
  const { user } = useAuthContext();
  const { updateProfile, changePassword, changeEmail, deleteAccount, signOut, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings, updateLocalization } = useSettings();
  const preferences = useNotificationStore((s) => s.preferences);
  const updatePreference = useNotificationStore((s) => s.updatePreference);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const activeCurrency = getCurrencyDef(settings.localization.currency);

  const handleExport = useCallback(() => {
    try {
      const state = useFinanceStore.getState();
      const notifState = useNotificationStore.getState();
      const sett = useSettingsStore.getState().settings;
      const data = exportBackupData(
        {
          transactions: state.transactions,
          budgets: state.budgets,
          goals: state.goals,
          goalHistory: state.goalHistory,
          debts: state.debts,
          accounts: state.accounts,
        },
        {
          notifications: notifState.notifications,
          preferences: notifState.preferences,
        },
        sett,
      );
      downloadBackup(data);
      notify.success("Backup exported", "Your data has been downloaded successfully.", "export");
    } catch {
      notify.error("Export failed", "Could not export your data. Please try again.", "export");
    }
  }, []);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await readBackupFile(file);
      const state = useFinanceStore.getState();
      const notifState = useNotificationStore.getState();

      useFinanceStore.getState().restoreData({
        transactions: deduplicateById(state.transactions, data.finance.transactions),
        budgets: deduplicateById(state.budgets, data.finance.budgets),
        goals: deduplicateById(state.goals, data.finance.goals),
        debts: deduplicateById(state.debts, data.finance.debts),
        accounts: deduplicateById(state.accounts, data.finance.accounts),
      });

      useNotificationStore.getState().restoreData({
        notifications: deduplicateById(notifState.notifications, data.notifications.notifications),
        preferences: data.notifications.preferences,
      });

      useSettingsStore.getState().restoreSettings(data.settings);

      notify.success("Backup restored", `Imported ${data.finance.transactions.length} transactions and more.`, "export");
    } catch (err) {
      notify.error("Import failed", err instanceof Error ? err.message : "Could not import the backup file.", "export");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const handleClearApplicationData = useCallback(() => {
    useFinanceStore.getState().clearAllData();
    useNotificationStore.getState().clearAllData();
    useSettingsStore.getState().clearAllData();
    notify.success("Data cleared", "All application data has been removed.", "system");
  }, []);

  const handleResetSettings = useCallback(() => {
    useSettingsStore.getState().resetAll();
    notify.success("Settings reset", "All settings have been restored to defaults.", "system");
  }, []);

  const [profileName, setProfileName] = useState(user?.displayName ?? "");
  const [profileSaving, setProfileSaving] = useState(false);

  const handleSaveProfile = useCallback(async () => {
    setProfileSaving(true);
    try {
      await updateProfile({ displayName: profileName.trim() || undefined });
      notify.success("Profile updated", "Your name has been saved.", "system");
    } catch (err) {
      notify.error("Update failed", err instanceof Error ? err.message : "Could not update profile.", "system");
    } finally {
      setProfileSaving(false);
    }
  }, [profileName, updateProfile]);

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const handleChangePassword = useCallback(async () => {
    setPwError(null);
    if (!pwCurrent) { setPwError("Current password is required."); return; }
    if (pwNew.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (pwNew !== pwConfirm) { setPwError("Passwords do not match."); return; }
    setPwSaving(true);
    try {
      await changePassword(pwCurrent, pwNew);
      notify.success("Password changed", "Your password has been updated.", "system");
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setPwSaving(false);
    }
  }, [pwCurrent, pwNew, pwConfirm, changePassword]);

  const [emailNew, setEmailNew] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleChangeEmail = useCallback(async () => {
    setEmailError(null);
    if (!emailPassword) { setEmailError("Password is required to change email."); return; }
    if (!emailNew) { setEmailError("New email address is required."); return; }
    setEmailSaving(true);
    try {
      await changeEmail(emailPassword, emailNew);
      notify.success("Email verification sent", "Check your new email to confirm the change.", "system");
      setEmailNew("");
      setEmailPassword("");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Could not change email.");
    } finally {
      setEmailSaving(false);
    }
  }, [emailNew, emailPassword, changeEmail]);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = useCallback(async () => {
    setDeleteError(null);
    if (!deletePassword) { setDeleteError("Enter your password to delete your account."); return; }
    setDeleteSaving(true);
    try {
      await deleteAccount(deletePassword);
      notify.success("Account deleted", "Your account and data have been removed.", "system");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete account.");
    } finally {
      setDeleteSaving(false);
    }
  }, [deletePassword, deleteAccount]);

  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signingOutRef = useRef(false);

  const handleSignOut = useCallback(async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    setIsSigningOut(true);
    try {
      await signOut();
      useFinanceStore.getState().clearAllData();
      useNotificationStore.getState().clearAllData();
      notify.success("Signed out", "You have been signed out successfully.", "system");
      navigate("/login", { replace: true });
    } catch (err) {
      notify.error("Sign out failed", err instanceof Error ? err.message : "Could not sign out. Please try again.", "system");
    } finally {
      signingOutRef.current = false;
      setIsSigningOut(false);
    }
  }, [signOut, navigate]);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Make Kobo work the way you do." />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleImport}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* ── Profile ── */}
        <section className="rounded-xl border bg-card p-5 shadow-elegant space-y-4" aria-labelledby="settings-profile">
          <h2 id="settings-profile" className="font-display font-semibold flex items-center gap-2">
            <User className="h-4 w-4" aria-hidden />
            Profile
          </h2>
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your display name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email ?? ""} disabled aria-disabled="true" />
            <p className="text-xs text-muted-foreground mt-1">
              To change your email, use the Security section below.
            </p>
          </div>
          <Button onClick={handleSaveProfile} disabled={profileSaving || !profileName.trim()}>
            {profileSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
          {user?.createdAt && (
            <p className="text-xs text-muted-foreground">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          )}
        </section>

        {/* ── Appearance ── */}
        <section className="rounded-xl border bg-card p-5 shadow-elegant space-y-4" aria-labelledby="settings-appearance">
          <h2 id="settings-appearance" className="font-display font-semibold">Appearance</h2>
          <p className="text-xs text-muted-foreground -mt-2">
            Choose your theme. System follows your device preference.
          </p>
          <RadioGroup
            value={theme}
            onValueChange={(v) => setTheme(v as ThemeMode)}
            className="flex gap-2"
            aria-label="Theme selection"
          >
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <Label
                key={value}
                htmlFor={`theme-${value}`}
                className="flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-input p-4 transition hover:bg-accent has-[:checked]:border-primary"
              >
                <RadioGroupItem value={value} id={`theme-${value}`} className="sr-only" />
                <Icon className="h-6 w-6" aria-hidden />
                <span className="font-medium text-sm">{label}</span>
              </Label>
            ))}
          </RadioGroup>
        </section>

        {/* ── Security ── */}
        <section className="rounded-xl border bg-card p-5 shadow-elegant space-y-4" aria-labelledby="settings-security">
          <h2 id="settings-security" className="font-display font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" aria-hidden />
            Security
          </h2>

          {/* Change password */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden />
              <h3 className="font-medium text-sm">Change password</h3>
            </div>
            <div className="space-y-2">
              <div>
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  autoComplete="current-password"
                  aria-invalid={!!pwError}
                  aria-describedby={pwError ? "pw-error" : undefined}
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  aria-invalid={!!pwError}
                  aria-describedby={pwError ? "pw-error" : undefined}
                />
              </div>
              <div>
                <Label htmlFor="confirmNewPassword">Confirm new password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  autoComplete="new-password"
                  aria-invalid={!!pwError}
                  aria-describedby={pwError ? "pw-error" : undefined}
                />
              </div>
              {pwError && (
                <p id="pw-error" className="text-xs text-destructive" role="alert">{pwError}</p>
              )}
              <Button
                onClick={handleChangePassword}
                disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm}
                size="sm"
              >
                {pwSaving ? (
                  <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Updating…</>
                ) : (
                  "Update password"
                )}
              </Button>
            </div>
          </div>

          {/* Change email */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
              <h3 className="font-medium text-sm">Change email</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              A verification will be sent to your new email address before the change takes effect.
            </p>
            <div className="space-y-2">
              <div>
                <Label htmlFor="newEmail">New email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={emailNew}
                  onChange={(e) => setEmailNew(e.target.value)}
                  placeholder="new@example.com"
                  autoComplete="email"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error-msg" : undefined}
                />
              </div>
              <div>
                <Label htmlFor="emailPassword">Confirm password</Label>
                <Input
                  id="emailPassword"
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  autoComplete="current-password"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error-msg" : undefined}
                />
              </div>
              {emailError && (
                <p id="email-error-msg" className="text-xs text-destructive" role="alert">{emailError}</p>
              )}
              <Button
                onClick={handleChangeEmail}
                disabled={emailSaving || !emailNew || !emailPassword}
                size="sm"
              >
                {emailSaving ? (
                  <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Sending…</>
                ) : (
                  "Change email"
                )}
              </Button>
            </div>
          </div>

          {/* Delete account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                <Trash2 className="h-4 w-4 mr-2" aria-hidden />
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <FileWarning className="h-5 w-5 text-destructive" aria-hidden />
                  Delete your account?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all associated data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-3 py-2">
                <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Your password"
                  aria-invalid={!!deleteError}
                  aria-describedby={deleteError ? "delete-error-msg" : undefined}
                />
                {deleteError && (
                  <p id="delete-error-msg" className="text-xs text-destructive" role="alert">{deleteError}</p>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setDeletePassword(""); setDeleteError(null); }}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteSaving || !deletePassword}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteSaving ? (
                    <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Deleting…</>
                  ) : (
                    "Delete my account"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        {/* ── Sign Out ── */}
        <section className="rounded-xl border bg-card p-5 shadow-elegant space-y-4" aria-labelledby="settings-signout">
          <h2 id="settings-signout" className="font-display font-semibold flex items-center gap-2">
            <LogOut className="h-4 w-4" aria-hidden />
            Sign Out
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">
            End your current session and return to the login screen.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" aria-label="Sign out of your account">
                <LogOut className="h-4 w-4 mr-2" aria-hidden />
                Sign Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign Out</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to sign out?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? (
                    <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Signing Out…</>
                  ) : (
                    "Sign Out"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        {/* ── Localization ── */}
        <section className="rounded-xl border bg-card p-5 shadow-elegant space-y-4 md:col-span-2" aria-labelledby="settings-localization">
          <h2 id="settings-localization" className="font-display font-semibold">Localization</h2>
          <p className="text-xs text-muted-foreground -mt-2">
            Control how currency, dates, numbers, and times are displayed.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Display currency</Label>
              <Select
                value={settings.localization.currency}
                onValueChange={(v) => updateLocalization({ currency: v })}
              >
                <SelectTrigger id="currency" className="w-full" aria-label="Display currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((cur) => (
                    <SelectItem key={cur.code} value={cur.code}>
                      {cur.symbol} — {cur.name} ({cur.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Preview: {formatCurrency(1234567, activeCurrency.code)} &middot; Symbol: {activeCurrency.symbol}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date format</Label>
              <Select
                value={settings.localization.dateFormat}
                onValueChange={(v) => updateLocalization({ dateFormat: v as DateFormatStyle })}
              >
                <SelectTrigger id="dateFormat" className="w-full" aria-label="Date format">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  {dateFormatOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label} — {o.example}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberFormat">Number format</Label>
              <Select
                value={settings.localization.numberFormat}
                onValueChange={(v) => updateLocalization({ numberFormat: v as NumberFormatStyle })}
              >
                <SelectTrigger id="numberFormat" className="w-full" aria-label="Number format">
                  <SelectValue placeholder="Select number format" />
                </SelectTrigger>
                <SelectContent>
                  {numberFormatOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label} — e.g. {o.example}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeFormat">Time format</Label>
              <Select
                value={settings.localization.timeFormat}
                onValueChange={(v) => updateLocalization({ timeFormat: v as TimeFormatStyle })}
              >
                <SelectTrigger id="timeFormat" className="w-full" aria-label="Time format">
                  <SelectValue placeholder="Select time format" />
                </SelectTrigger>
                <SelectContent>
                  {timeFormatOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label} — {o.example}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* ── Notifications ── */}
        <section className="rounded-xl border bg-card p-5 shadow-elegant space-y-4" aria-labelledby="settings-notifications">
          <h2 id="settings-notifications" className="font-display font-semibold">Notifications</h2>
          <p className="text-xs text-muted-foreground -mt-2">
            Choose which notifications you want to see. Changes take effect immediately.
          </p>
          {prefDefs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No notification preferences available.</p>
          ) : (
            prefDefs.map(({ key, label, description }) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  checked={preferences[key]}
                  onCheckedChange={(v) => updatePreference(key, v)}
                  aria-label={`Toggle ${label}`}
                  className="shrink-0 mt-0.5"
                />
              </div>
            ))
          )}
        </section>

        {/* ── Backup & Restore ── */}
        <section className="rounded-xl border bg-card p-5 shadow-elegant space-y-4" aria-labelledby="settings-backup">
          <h2 id="settings-backup" className="font-display font-semibold">Backup &amp; Restore</h2>
          <p className="text-xs text-muted-foreground -mt-2">
            Export your data as a JSON file or import a previously saved backup.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport} aria-label="Export application data">
              <Download className="h-4 w-4 mr-2" aria-hidden />
              Export data
            </Button>
            <Button
              variant="outline"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Import backup file"
            >
              <Upload className="h-4 w-4 mr-2" aria-hidden />
              {importing ? "Importing…" : "Import data"}
            </Button>
          </div>
        </section>

        {/* ── Data Management ── */}
        <section className="rounded-xl border bg-card p-5 shadow-elegant space-y-4 md:col-span-2" aria-labelledby="settings-data">
          <h2 id="settings-data" className="font-display font-semibold">Data Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage your application data. These actions cannot be undone.
          </p>
          <div className="flex flex-wrap gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" aria-label="Reset all settings">
                  <RotateCcw className="h-4 w-4 mr-2" aria-hidden />
                  Reset settings
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" aria-hidden />
                    Reset all settings?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will restore all settings (theme, localization, notifications) to their defaults.
                    Your financial data will not be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetSettings}>
                    Reset settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" aria-label="Clear all application data">
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden />
                  Clear all data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <FileWarning className="h-5 w-5 text-destructive" aria-hidden />
                    Clear all application data?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove all your transactions, budgets, goals, debts, accounts,
                    notifications, and reset settings to defaults.
                    <strong className="block mt-2">This action cannot be undone.</strong>
                    Export a backup first if you want to keep your data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearApplicationData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </div>
    </div>
  );
}
