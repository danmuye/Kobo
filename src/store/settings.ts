import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

export type CurrencyCode = string;

export type DateFormatStyle = "MM/dd/yyyy" | "dd/MM/yyyy" | "yyyy-MM-dd";

export type NumberFormatStyle = "1,234.56" | "1 234,56" | "1.234,56";

export type TimeFormatStyle = "12h" | "24h";

export interface AppearanceSettings {
  theme: ThemeMode;
}

export interface LocalizationSettings {
  currency: CurrencyCode;
  locale: string;
  dateFormat: DateFormatStyle;
  numberFormat: NumberFormatStyle;
  timeFormat: TimeFormatStyle;
}

export interface AppSettings {
  appearance: AppearanceSettings;
  localization: LocalizationSettings;
}

interface SettingsState {
  settings: AppSettings;
  updateAppearance: (patch: Partial<AppearanceSettings>) => void;
  updateLocalization: (patch: Partial<LocalizationSettings>) => void;
  resetAll: () => void;
  restoreSettings: (s: AppSettings) => void;
  clearAllData: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  appearance: {
    theme: "light",
  },
  localization: {
    currency: "NGN",
    locale: "en-NG",
    dateFormat: "MM/dd/yyyy",
    numberFormat: "1,234.56",
    timeFormat: "12h",
  },
};

export const useSettingsStore = create<SettingsState>()(
  (set) => ({
    settings: { ...DEFAULT_SETTINGS },

    updateAppearance: (patch) => {
      set((s) => ({
        settings: {
          ...s.settings,
          appearance: { ...s.settings.appearance, ...patch },
        },
      }));
    },

    updateLocalization: (patch) => {
      set((s) => ({
        settings: {
          ...s.settings,
          localization: { ...s.settings.localization, ...patch },
        },
      }));
    },

    resetAll: () => {
      set({ settings: { ...DEFAULT_SETTINGS } });
    },

    restoreSettings: (s) => {
      set({ settings: { ...s } });
    },

    clearAllData: () => {
      set({ settings: { ...DEFAULT_SETTINGS } });
    },
  }),
);

export const selectTheme = (s: SettingsState) => s.settings.appearance.theme;
export const selectCurrency = (s: SettingsState) => s.settings.localization.currency;
export const selectLocale = (s: SettingsState) => s.settings.localization.locale;
export const selectDateFormat = (s: SettingsState) => s.settings.localization.dateFormat;
export const selectNumberFormat = (s: SettingsState) => s.settings.localization.numberFormat;
export const selectTimeFormat = (s: SettingsState) => s.settings.localization.timeFormat;
export const selectSettings = (s: SettingsState) => s.settings;
