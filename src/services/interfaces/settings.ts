import type { AppSettings } from "@/store/settings";
import type { AppearanceSettings, LocalizationSettings } from "@/store/settings";

export interface ISettingsService {
  get(): AppSettings;
  updateAppearance(patch: Partial<AppearanceSettings>): void;
  updateLocalization(patch: Partial<LocalizationSettings>): void;
  resetAll(): void;
  restoreSettings(s: AppSettings): void;
  clearAllData(): void;
}
