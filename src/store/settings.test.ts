import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "./settings";

beforeEach(() => {
  useSettingsStore.getState().resetAll();
});

describe("useSettingsStore", () => {
  it("starts with default settings", () => {
    const { settings } = useSettingsStore.getState();
    expect(settings.appearance.theme).toBe("light");
    expect(settings.localization.currency).toBe("NGN");
    expect(settings.localization.locale).toBe("en-NG");
    expect(settings.localization.dateFormat).toBe("MM/dd/yyyy");
    expect(settings.localization.numberFormat).toBe("1,234.56");
    expect(settings.localization.timeFormat).toBe("12h");
  });

  describe("updateAppearance", () => {
    it("merges appearance partial", () => {
      useSettingsStore.getState().updateAppearance({ theme: "dark" });
      expect(useSettingsStore.getState().settings.appearance.theme).toBe("dark");
      expect(useSettingsStore.getState().settings.localization.currency).toBe("NGN");
    });
  });

  describe("updateLocalization", () => {
    it("merges localization partial", () => {
      useSettingsStore.getState().updateLocalization({ currency: "USD", dateFormat: "dd/MM/yyyy" });
      const loc = useSettingsStore.getState().settings.localization;
      expect(loc.currency).toBe("USD");
      expect(loc.dateFormat).toBe("dd/MM/yyyy");
      expect(loc.timeFormat).toBe("12h");
    });
  });

  describe("resetAll", () => {
    it("resets to defaults", () => {
      useSettingsStore.getState().updateAppearance({ theme: "dark" });
      useSettingsStore.getState().updateLocalization({ currency: "EUR" });
      useSettingsStore.getState().resetAll();
      expect(useSettingsStore.getState().settings.appearance.theme).toBe("light");
      expect(useSettingsStore.getState().settings.localization.currency).toBe("NGN");
    });
  });

  describe("restoreSettings", () => {
    it("replaces entire settings", () => {
      useSettingsStore.getState().restoreSettings({
        appearance: { theme: "dark" },
        localization: { currency: "USD", locale: "en-US", dateFormat: "yyyy-MM-dd", numberFormat: "1,234.56", timeFormat: "24h" },
      });
      expect(useSettingsStore.getState().settings.appearance.theme).toBe("dark");
      expect(useSettingsStore.getState().settings.localization.currency).toBe("USD");
    });
  });

  describe("clearAllData", () => {
    it("resets to defaults", () => {
      useSettingsStore.getState().updateLocalization({ currency: "GBP" });
      useSettingsStore.getState().clearAllData();
      expect(useSettingsStore.getState().settings.localization.currency).toBe("NGN");
    });
  });
});
