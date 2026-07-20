import { describe, it, expect, beforeEach } from "vitest";
import { formatNaira, formatDate, formatPercent, formatNumber, formatTime } from "./format";
import { formatCurrency, getCurrencySymbol, getCurrencyDef } from "./currency";
import { useSettingsStore } from "@/store/settings";

beforeEach(() => {
  useSettingsStore.getState().resetAll();
});

describe("getCurrencyDef", () => {
  it("returns USD def for unknown code", () => {
    expect(getCurrencyDef("XYZ").code).toBe("USD");
  });

  it("returns NGN def", () => {
    const def = getCurrencyDef("NGN");
    expect(def.symbol).toBe("₦");
    expect(def.locale).toBe("en-NG");
  });
});

describe("getCurrencySymbol", () => {
  it("returns ₦ for NGN", () => {
    expect(getCurrencySymbol("NGN")).toBe("₦");
  });
  it("returns $ for USD", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
  });
});

describe("formatCurrency", () => {
  it("formats NGN with default locale", () => {
    const result = formatCurrency(1500, "NGN");
    expect(result).toContain("₦");
    expect(result).toContain("1,500");
  });

  it("formats USD", () => {
    const result = formatCurrency(2500.5, "USD");
    expect(result).toContain("$");
    expect(result).toContain("2,501");
  });

  it("compact mode formats millions", () => {
    const result = formatCurrency(2_500_000, "NGN", { compact: true });
    expect(result).toBe("₦2.50M");
  });

  it("compact mode formats thousands", () => {
    const result = formatCurrency(3500, "NGN", { compact: true });
    expect(result).toBe("₦3.5K");
  });

  it("respects fractionDigits option", () => {
    const result = formatCurrency(1500.99, "NGN", { fractionDigits: 2 });
    const parts = result.split(".");
    expect(parts).toHaveLength(2);
  });
});

describe("formatNaira", () => {
  it("formats using NGN from settings", () => {
    const result = formatNaira(5000);
    expect(result).toContain("₦");
  });

  it("compact mode works", () => {
    const result = formatNaira(2_000_000, { compact: true });
    expect(result).toBe("₦2.00M");
  });
});

describe("formatDate", () => {
  it("defaults to MM/dd/yyyy style", () => {
    const result = formatDate("2024-06-15");
    expect(result).toMatch(/Jun\s+15,\s+2024/);
  });

  it("formats dd/MM/yyyy style", () => {
    useSettingsStore.getState().updateLocalization({ dateFormat: "dd/MM/yyyy" });
    const result = formatDate("2024-06-15");
    expect(result).toMatch(/15\s+Jun\s+2024/);
  });

  it("formats yyyy-MM-dd style", () => {
    useSettingsStore.getState().updateLocalization({ dateFormat: "yyyy-MM-dd" });
    const result = formatDate("2024-06-15");
    expect(result).toBe("2024-06-15");
  });
});

describe("formatNumber", () => {
  it("formats with en-US locale by default", () => {
    expect(formatNumber(1234.56)).toBe("1,234.56");
  });

  it("uses de-DE locale when set", () => {
    useSettingsStore.getState().updateLocalization({ numberFormat: "1 234,56" });
    expect(formatNumber(1234.56)).toBe("1.234,56");
  });
});

describe("formatTime", () => {
  it("formats 12h by default", () => {
    const result = formatTime("2024-06-15T14:30:00");
    expect(result).toMatch(/2:30/);
  });

  it("formats 24h when set", () => {
    useSettingsStore.getState().updateLocalization({ timeFormat: "24h" });
    const result = formatTime("2024-06-15T14:30:00");
    expect(result).toBe("14:30");
  });
});

describe("formatPercent", () => {
  it("formats with one decimal", () => {
    expect(formatPercent(75.3)).toBe("75.3%");
  });

  it("handles whole numbers", () => {
    expect(formatPercent(100)).toBe("100.0%");
  });

  it("handles zero", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });
});
