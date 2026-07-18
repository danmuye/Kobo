import type { IFinanceService, ISettingsService, INotificationService } from "./interfaces";
import { LocalFinanceService } from "./implementations/localStorage/finance";
import { LocalSettingsService } from "./implementations/localStorage/settings";
import { LocalNotificationService } from "./implementations/localStorage/notifications";
import { initializeFirebase, isConfigured, getMissingConfigKeys } from "./firebase/config";
import { getFirebaseStatus, onFirebaseStatusChange } from "./firebase/status";

export type BackendKind = "localStorage" | "firebase";

let currentBackend: BackendKind = "localStorage";

let financeService: IFinanceService | null = null;
let settingsService: ISettingsService | null = null;
let notificationService: INotificationService | null = null;

let currentLocalFinance: LocalFinanceService | null = null;
let currentLocalSettings: LocalSettingsService | null = null;
let currentLocalNotif: LocalNotificationService | null = null;

function createLocalServices(): void {
  currentLocalFinance?.destroy();
  currentLocalSettings?.destroy();
  currentLocalNotif?.destroy();

  const fin = new LocalFinanceService();
  const set = new LocalSettingsService();
  const not = new LocalNotificationService();

  fin.init();
  set.init();
  not.init();

  currentLocalFinance = fin;
  currentLocalSettings = set;
  currentLocalNotif = not;

  financeService = fin;
  settingsService = set;
  notificationService = not;
}

createLocalServices();

const statusListeners = new Set<(status: FirebaseStatus) => void>();

export function getFinanceService(): IFinanceService {
  return financeService!;
}

export function getSettingsService(): ISettingsService {
  return settingsService!;
}

export function getNotificationService(): INotificationService {
  return notificationService!;
}

export function isFirebaseAvailable(): boolean {
  return isConfigured();
}

export function getFirebaseInitStatus(): FirebaseStatus {
  return getFirebaseStatus();
}

export function onBackendStatusChange(fn: (status: FirebaseStatus) => void): () => void {
  statusListeners.add(fn);
  const unsub = onFirebaseStatusChange(() => {
    fn(getFirebaseStatus());
  });
  return () => {
    statusListeners.delete(fn);
    unsub();
  };
}

export async function initializeBackend(): Promise<void> {
  if (import.meta.env.DEV) {
    console.log("[Backend] Initializing...");
  }
  if (isConfigured()) {
    if (import.meta.env.DEV) {
      console.log("[Backend] Firebase is configured — starting initialization");
    }
    try {
      await initializeFirebase();
      if (import.meta.env.DEV) {
        console.log("[Backend] Firebase initialized successfully");
      }
    } catch {
      if (import.meta.env.DEV) {
        console.log("[Backend] Firebase init failed — staying on localStorage");
      }
    }
  } else {
    if (import.meta.env.DEV) {
      console.log("[Backend] Firebase not configured — using localStorage");
    }
  }
}

export async function setBackend(
  kind: BackendKind,
  userId?: string,
): Promise<void> {
  currentBackend = kind;

  if (kind === "localStorage") {
    createLocalServices();
    return;
  }

  if (kind === "firebase") {
    if (!isConfigured()) {
      const missing = getMissingConfigKeys();
      throw new Error(
        `Firebase is not configured. Missing: ${missing.join(", ")}. ` +
        "Set these in your environment variables.",
      );
    }

    if (!userId) {
      throw new Error("userId is required for Firebase backend");
    }

    await initializeFirebase();

    const { FirebaseFinanceService } = await import(
      "./implementations/firebase/finance"
    );
    const { FirebaseSettingsService } = await import(
      "./implementations/firebase/settings"
    );
    const { FirebaseNotificationService } = await import(
      "./implementations/firebase/notifications"
    );

    currentLocalFinance?.destroy();
    currentLocalSettings?.destroy();
    currentLocalNotif?.destroy();
    currentLocalFinance = null;
    currentLocalSettings = null;
    currentLocalNotif = null;

    const fbFinance = new FirebaseFinanceService(userId);
    const fbSettings = new FirebaseSettingsService(userId);
    const fbNotif = new FirebaseNotificationService(userId);

    financeService = fbFinance;
    settingsService = fbSettings;
    notificationService = fbNotif;

    await Promise.all([
      fbFinance.init(),
      fbSettings.init(),
      fbNotif.init(),
    ]);
  }
}
