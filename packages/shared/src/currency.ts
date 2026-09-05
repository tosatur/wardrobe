import { z } from "zod";

export const CURRENCY_CODES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "INR",
  "NZD",
  "SEK",
  "NOK",
  "DKK",
  "ZAR",
  "BRL",
  "MXN",
  "SGD",
  "HKD",
  "KRW",
] as const;

export const CurrencyCodeSchema = z.enum(CURRENCY_CODES);
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc" },
  { code: "CNY", symbol: "¥", label: "Chinese Yuan" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "NZD", symbol: "NZ$", label: "New Zealand Dollar" },
  { code: "SEK", symbol: "kr", label: "Swedish Krona" },
  { code: "NOK", symbol: "kr", label: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", label: "Danish Krone" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
  { code: "BRL", symbol: "R$", label: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", label: "Mexican Peso" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", label: "Hong Kong Dollar" },
  { code: "KRW", symbol: "₩", label: "South Korean Won" },
];

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

/**
 * The bare symbol as actually used within the currency's own country
 * (e.g. "$" for AUD, not the "A$" disambiguated form from `currencySymbol`).
 */
export function currencyNarrowSymbol(code: string): string {
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((part) => part.type === "currency")?.value ?? currencySymbol(code);
  } catch {
    return currencySymbol(code);
  }
}
