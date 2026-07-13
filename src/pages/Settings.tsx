import { useCallback, useRef, useState } from "react";
import { Sun, Moon, Monitor, Download, Upload, RotateCcw, Trash2, AlertTriangle, FileWarning } from "lucide-react";
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
import { getFinanceService, getSettingsService, getNotificationService } from "@/services/service-provider";
import { useFinanceStore } from "@/store/finance";
import { useNotificationStore } from "@/store/notifications";
import { useTheme } from "@/components/theme-provider";
import { useSettings } from "@/features/settings/hooks";
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
  const { theme, setTheme } = useTheme();
  const { settings, updateLocalization } = useSettings();
  const preferences = useNotificationStore((s) => s.preferences);
  const updatePreference = useNotificationStore((s) => s.updatePreference);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const activeCurrency = getCurrencyDef(settings.localization.currency);

  const handleExport = useCallback(() => {
    try {
      const fsvc = getFinanceService();
      const nsvc = getNotificationService();
      const ssvc = getSettingsService();
      const state = useFinanceStore.getState();
      const notifState = useNotificationStore.getState();
      const data = exportBackupData(
        {
          transactions: state.transactions,
          budgets: state.budgets,
          goals: state.goals,
          goalContributions: state.goalContributions,
          goalMilestones: state.goalMilestones,
          debts: state.debts,
          accounts: state.accounts,
        },
        {
          notifications: notifState.notifications,
          preferences: notifState.preferences,
        },
        ssvc.get(),
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
      const fsvc = getFinanceService();
      const nsvc = getNotificationService();
      const ssvc = getSettingsService();

      fsvc.restoreData({
        transactions: deduplicateById(state.transactions, data.finance.transactions),
        budgets: deduplicateById(state.budgets, data.finance.budgets),
        goals: deduplicateById(state.goals, data.finance.goals),
        goalContributions: deduplicateById(state.goalContributions, data.finance.goalContributions),
        goalMilestones: deduplicateById(state.goalMilestones, data.finance.goalMilestones),
        debts: deduplicateById(state.debts, data.finance.debts),
        accounts: deduplicateById(state.accounts, data.finance.accounts),
      });

      nsvc.restoreData({
        notifications: deduplicateById(notifState.notifications, data.notifications.notifications),
        preferences: data.notifications.preferences,
      });

      ssvc.restoreSettings(data.settings);

      notify.success("Backup restored", `Imported ${data.finance.transactions.length} transactions and more.`, "export");
    } catch (err) {
      notify.error("Import failed", err instanceof Error ? err.message : "Could not import the backup file.", "export");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const handleResetDemoData = useCallback(() => {
    getFinanceService().resetDemoData();
    notify.success("Demo data restored", "The original demo data has been reloaded.", "system");
  }, []);

  const handleClearApplicationData = useCallback(() => {
    getFinanceService().clearAllData();
    getNotificationService().clearAllData();
    getSettingsService().clearAllData();
    notify.success("Data cleared", "All application data has been removed.", "system");
  }, []);

  const handleResetSettings = useCallback(() => {
    getSettingsService().resetAll();
    notify.success("Settings reset", "All settings have been restored to defaults.", "system");
  }, []);

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
          <h3 id="settings-profile" className="font-display font-semibold">Profile</h3>
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" defaultValue="Adaeze Okonkwo" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="adaeze@example.com" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" defaultValue="+234 803 000 0000" />
          </div>
          <Button onClick={() => notify.success("Profile saved", "", "system")}>Save changes</Button>
        </section>

        {/* ── Appearance ── */}
        <section className="rounded-xl border bg-card p-5 shadow-elegant space-y-4" aria-labelledby="settings-appearance">
          <h3 id="settings-appearance" className="font-display font-semibold">Appearance</h3>
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

        {/* ── Localization ── */}
        <section className="rounded-xl border bg-card p-5 shadow-elegant space-y-4 md:col-span-2" aria-labelledby="settings-localization">
          <h3 id="settings-localization" className="font-display font-semibold">Localization</h3>
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
          <h3 id="settings-notifications" className="font-display font-semibold">Notifications</h3>
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
          <h3 id="settings-backup" className="font-display font-semibold">Backup &amp; Restore</h3>
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
          <h3 id="settings-data" className="font-display font-semibold">Data Management</h3>
          <p className="text-sm text-muted-foreground">
            Your data is stored locally in your browser. Use these tools to manage it.
          </p>
          <div className="flex flex-wrap gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" aria-label="Reset to demo data">
                  <RotateCcw className="h-4 w-4 mr-2" aria-hidden />
                  Reset demo data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" aria-hidden />
                    Reset demo data?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will replace all your current data with the original demo data.
                    Any changes you have made will be lost. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetDemoData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Reset demo data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

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
