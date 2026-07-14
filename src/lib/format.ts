import type { DateFormatStyle, NumberFormatStyle, TimeFormatStyle } from "@/store/settings";
import { useSettingsStore } from "@/store/settings";
import { formatCurrency as _formatCurrency, getCurrencySymbol, getCurrencyDef } from "./currency";

export { formatCurrency, getCurrencySymbol, getCurrencyDef } from "./currency";

const numberFormatLocale: Record<NumberFormatStyle, string> = {
  "1,234.56": "en-US",
  "1 234,56": "de-DE",
  "1.234,56": "id-ID",
};

const timeFormatLocale: Record<TimeFormatStyle, Intl.DateTimeFormatOptions> = {
  "12h": { hour: "numeric", minute: "2-digit", hour12: true },
  "24h": { hour: "2-digit", minute: "2-digit", hour12: false },
};

function getLocalization() {
  return useSettingsStore.getState().settings.localization;
}

export const formatNaira = (amount: number, opts: { compact?: boolean } = {}) => {
  const currency = getLocalization().currency;
  return _formatCurrency(amount, currency, opts);
};

export const formatDate = (iso: string) => {
  const format = getLocalization().dateFormat;
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const monthName = date.toLocaleDateString("en-US", { month: "short" });

  switch (format as DateFormatStyle) {
    case "dd/MM/yyyy":
      return `${day} ${monthName} ${year}`;
    case "yyyy-MM-dd":
      return `${year}-${month}-${day}`;
    case "MM/dd/yyyy":
    default:
      return `${monthName} ${day}, ${year}`;
  }
};

export const formatNumber = (n: number) => {
  const style = getLocalization().numberFormat;
  const locale = numberFormatLocale[style as NumberFormatStyle] ?? "en-US";
  return new Intl.NumberFormat(locale).format(n);
};

export const formatTime = (iso: string) => {
  const style = getLocalization().timeFormat;
  const opts = timeFormatLocale[style as TimeFormatStyle] ?? timeFormatLocale["12h"];
  return new Date(iso).toLocaleTimeString("en-US", opts);
};

export const formatPercent = (n: number) => `${n.toFixed(1)}%`;
