export interface CurrencyDef {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: CurrencyDef[] = [
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", locale: "en-NG" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" },
  { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", locale: "en-CA" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", locale: "en-AU" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "CNY", name: "Chinese Yuan", symbol: "CN¥", locale: "zh-CN" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "ZAR", name: "South African Rand", symbol: "R", locale: "en-ZA" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", locale: "de-CH" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", locale: "en-GH" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", locale: "en-KE" },
  { code: "XOF", name: "West African CFA", symbol: "CFA", locale: "fr-BF" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", locale: "ar-EG" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", locale: "ar-SA" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", locale: "ar-AE" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", locale: "pt-BR" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", locale: "ko-KR" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", locale: "sv-SE" },
];

const currencyMap = new Map(CURRENCIES.map((c) => [c.code, c]));

export function getCurrencyDef(code: string): CurrencyDef {
  return currencyMap.get(code) ?? currencyMap.get("USD")!;
}

export function getCurrencySymbol(code: string): string {
  return getCurrencyDef(code).symbol;
}

export function getCurrencyLocale(code: string): string {
  return getCurrencyDef(code).locale;
}

export function formatCurrency(
  amount: number,
  currencyCode: string = "NGN",
  opts: { compact?: boolean; fractionDigits?: number } = {},
): string {
  const def = getCurrencyDef(currencyCode);
  if (opts.compact) {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) return `${def.symbol}${(amount / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${def.symbol}${(amount / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat(def.locale, {
    style: "currency",
    currency: def.code,
    maximumFractionDigits: opts.fractionDigits ?? 0,
  }).format(amount);
}

export function formatCurrencyInputLabel(currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `Amount (${symbol})`;
}
