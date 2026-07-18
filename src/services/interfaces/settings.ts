import type { AppSettings } from "@/store/settings";
import type { AppearanceSettings, LocalizationSettings } from "@/store/settings";

export interface ISettingsService {
  get(): AppSettings;
  updateAppearance(patch: Partial<AppearanceSettings>): Promise<void>;
  updateLocalization(patch: Partial<LocalizationSettings>): Promise<void>;
  resetAll(): Promise<void>;
  restoreSettings(s: AppSettings): Promise<void>;
  clearAllData(): Promise<void>;
}
