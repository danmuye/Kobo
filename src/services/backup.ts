import type { Transaction, Budget, Goal, Debt, Account } from "@/types";
import type { GoalHistoryEntry } from "@/services/goal-insights";
import type { AppNotification, NotificationPreferences } from "@/types/notifications";
import type { AppSettings } from "@/store/settings";

interface BackupData {
  version: 1;
  exportedAt: string;
  finance: {
    transactions: Transaction[];
    budgets: Budget[];
    goals: Goal[];
    goalHistory: GoalHistoryEntry[];
    debts: Debt[];
    accounts: Account[];
  };
  notifications: {
    notifications: AppNotification[];
    preferences: NotificationPreferences;
  };
  settings: AppSettings;
}

const BACKUP_VERSION = 1 as const;

function getTimestamp(): string {
  return new Date().toISOString();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function isBackupData(raw: unknown): raw is BackupData {
  if (!raw || typeof raw !== "object") return false;
  const d = raw as Record<string, unknown>;
  if (d.version !== BACKUP_VERSION) return false;
  if (typeof d.exportedAt !== "string") return false;
  if (!d.finance || typeof d.finance !== "object") return false;
  if (!d.settings || typeof d.settings !== "object") return false;
  return true;
}

export function exportBackupData(
  finance: BackupData["finance"],
  notifications: BackupData["notifications"],
  settings: AppSettings,
): BackupData {
  return {
    version: BACKUP_VERSION,
    exportedAt: getTimestamp(),
    finance,
    notifications,
    settings,
  };
}

export function downloadBackup(data: BackupData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const filename = `kobo-backup-${getTimestamp().slice(0, 10)}.json`;
  downloadBlob(blob, filename);
}

export function readBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith(".json")) {
      reject(new Error("Invalid file format. Please select a .json backup file."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(reader.result as string);
        if (!isBackupData(raw)) {
          reject(new Error("Invalid backup file. The file structure is not recognized."));
          return;
        }
        resolve(raw);
      } catch {
        reject(new Error("Could not parse backup file. The file may be corrupted."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsText(file);
  });
}

export function deduplicateById<T extends { id: string }>(
  existing: T[],
  incoming: T[],
): T[] {
  const existingIds = new Set(existing.map((item) => item.id));
  const unique = incoming.filter((item) => !existingIds.has(item.id));
  return unique;
}
