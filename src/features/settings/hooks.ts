import { useCallback } from "react";
import { useSettingsStore, selectCurrency } from "@/store/settings";
import { getSettingsService } from "@/services/service-provider";
import type { AppearanceSettings, LocalizationSettings } from "@/store/settings";
import { formatCurrency as _formatCurrency, getCurrencyDef } from "@/lib/currency";

export function useSettings() {
  const settings = useSettingsStore((s) => s.settings);
  const svc = getSettingsService();

  return {
    settings,
    updateAppearance: (patch: Partial<AppearanceSettings>) => svc.updateAppearance(patch),
    updateLocalization: (patch: Partial<LocalizationSettings>) => svc.updateLocalization(patch),
    resetAll: () => svc.resetAll(),
    restoreSettings: (s: typeof settings) => svc.restoreSettings(s),
    clearAllData: () => svc.clearAllData(),
  };
}

export function useActiveCurrency() {
  const currency = useSettingsStore(selectCurrency);
  const def = getCurrencyDef(currency);
  return { currency, symbol: def.symbol, locale: def.locale, def };
}

export function useCurrencyFormat() {
  const currency = useSettingsStore(selectCurrency);
  return useCallback(
    (amount: number, opts?: { compact?: boolean; fractionDigits?: number }) =>
      _formatCurrency(amount, currency, opts),
    [currency],
  );
}
