import type { AppearanceSettings, LocalizationSettings, AppSettings } from "@/store/settings";
import type { ISettingsService } from "@/services/interfaces";
import { useSettingsStore } from "@/store/settings";

const STORAGE_KEY = "kobo-settings-v1";

function persistSettingsState(): void {
  const { settings } = useSettingsStore.getState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function loadSettingsState(): AppSettings | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export class LocalSettingsService implements ISettingsService {
  private unsub: (() => void) | null = null;

  init(): void {
    const saved = loadSettingsState();
    if (saved) {
      useSettingsStore.getState().restoreSettings(saved);
    }
    this.unsub = useSettingsStore.subscribe(() => {
      persistSettingsState();
    });
  }

  destroy(): void {
    this.unsub?.();
  }

  get(): AppSettings {
    return useSettingsStore.getState().settings;
  }
  async updateAppearance(patch: Partial<AppearanceSettings>): Promise<void> {
    useSettingsStore.getState().updateAppearance(patch);
  }
  async updateLocalization(patch: Partial<LocalizationSettings>): Promise<void> {
    useSettingsStore.getState().updateLocalization(patch);
  }
  async resetAll(): Promise<void> {
    useSettingsStore.getState().resetAll();
  }
  async restoreSettings(s: AppSettings): Promise<void> {
    useSettingsStore.getState().restoreSettings(s);
  }
  async clearAllData(): Promise<void> {
    useSettingsStore.getState().clearAllData();
  }
}
