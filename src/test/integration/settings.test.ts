import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore, selectTheme, selectCurrency, selectLocale, selectDateFormat, selectNumberFormat, selectTimeFormat } from "@/store/settings";
import type { AppSettings } from "@/store/settings";

const defaultSettings: AppSettings = {
  appearance: { theme: "light" },
  localization: {
    currency: "NGN",
    locale: "en-NG",
    dateFormat: "MM/dd/yyyy",
    numberFormat: "1,234.56",
    timeFormat: "12h",
  },
};

beforeEach(() => {
  useSettingsStore.setState({ settings: { ...defaultSettings, appearance: { ...defaultSettings.appearance }, localization: { ...defaultSettings.localization } } });
});

describe("Settings workflow", () => {
  it("has default settings", () => {
    const state = useSettingsStore.getState().settings;
    expect(state.appearance.theme).toBe("light");
    expect(state.localization.currency).toBe("NGN");
    expect(state.localization.locale).toBe("en-NG");
    expect(state.localization.dateFormat).toBe("MM/dd/yyyy");
  });

  it("switches theme to dark", () => {
    useSettingsStore.getState().updateAppearance({ theme: "dark" });

    const theme = selectTheme(useSettingsStore.getState());
    expect(theme).toBe("dark");
    expect(useSettingsStore.getState().settings.appearance.theme).toBe("dark");
  });

  it("switches theme to system", () => {
    useSettingsStore.getState().updateAppearance({ theme: "system" });

    expect(selectTheme(useSettingsStore.getState())).toBe("system");
  });

  it("changes currency", () => {
    useSettingsStore.getState().updateLocalization({ currency: "USD" });

    expect(selectCurrency(useSettingsStore.getState())).toBe("USD");
    expect(useSettingsStore.getState().settings.localization.currency).toBe("USD");
  });

  it("changes locale", () => {
    useSettingsStore.getState().updateLocalization({ locale: "en-US" });

    expect(selectLocale(useSettingsStore.getState())).toBe("en-US");
  });

  it("changes date format", () => {
    useSettingsStore.getState().updateLocalization({ dateFormat: "dd/MM/yyyy" });

    expect(selectDateFormat(useSettingsStore.getState())).toBe("dd/MM/yyyy");
  });

  it("changes number format", () => {
    useSettingsStore.getState().updateLocalization({ numberFormat: "1 234,56" });

    expect(selectNumberFormat(useSettingsStore.getState())).toBe("1 234,56");
  });

  it("changes time format to 24h", () => {
    useSettingsStore.getState().updateLocalization({ timeFormat: "24h" });

    expect(selectTimeFormat(useSettingsStore.getState())).toBe("24h");
  });

  it("resets all settings to defaults", () => {
    useSettingsStore.getState().updateAppearance({ theme: "dark" });
    useSettingsStore.getState().updateLocalization({ currency: "EUR", locale: "de-DE" });
    expect(selectTheme(useSettingsStore.getState())).toBe("dark");
    expect(selectCurrency(useSettingsStore.getState())).toBe("EUR");

    useSettingsStore.getState().resetAll();

    expect(selectTheme(useSettingsStore.getState())).toBe("light");
    expect(selectCurrency(useSettingsStore.getState())).toBe("NGN");
    expect(selectLocale(useSettingsStore.getState())).toBe("en-NG");
  });

  it("restores settings from backup", () => {
    const backup: AppSettings = {
      appearance: { theme: "dark" },
      localization: { currency: "GBP", locale: "en-GB", dateFormat: "dd/MM/yyyy", numberFormat: "1,234.56", timeFormat: "24h" },
    };

    useSettingsStore.getState().restoreSettings(backup);

    expect(selectTheme(useSettingsStore.getState())).toBe("dark");
    expect(selectCurrency(useSettingsStore.getState())).toBe("GBP");
    expect(selectLocale(useSettingsStore.getState())).toBe("en-GB");
    expect(selectDateFormat(useSettingsStore.getState())).toBe("dd/MM/yyyy");
    expect(selectTimeFormat(useSettingsStore.getState())).toBe("24h");
  });

  it("clears all data (resets to defaults)", () => {
    useSettingsStore.getState().updateAppearance({ theme: "dark" });
    useSettingsStore.getState().clearAllData();

    expect(selectTheme(useSettingsStore.getState())).toBe("light");
    expect(selectCurrency(useSettingsStore.getState())).toBe("NGN");
  });
});
