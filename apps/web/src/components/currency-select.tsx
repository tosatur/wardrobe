"use client";

import { CURRENCIES, type CurrencyCode } from "@wardrobe/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Flag emoji, not a currency symbol (currencySymbol already covers that) -
// gives the dropdown a quick visual scan target, per currency code rather
// than per country since that's what CURRENCIES itself is keyed by.
const CURRENCY_FLAGS: Record<CurrencyCode, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  CHF: "🇨🇭",
  CNY: "🇨🇳",
  INR: "🇮🇳",
  NZD: "🇳🇿",
  SEK: "🇸🇪",
  NOK: "🇳🇴",
  DKK: "🇩🇰",
  ZAR: "🇿🇦",
  BRL: "🇧🇷",
  MXN: "🇲🇽",
  SGD: "🇸🇬",
  HKD: "🇭🇰",
  KRW: "🇰🇷",
};

export function CurrencySelect({
  value,
  onChange,
  id,
  triggerClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  /** Override the trigger's own styling, e.g. to blend into an InputGroup. */
  triggerClassName?: string;
}) {
  return (
    <Select value={value} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger id={id} className={cn("w-full", triggerClassName)}>
        <SelectValue>
          {(code: CurrencyCode) => (
            <>
              <span aria-hidden>{CURRENCY_FLAGS[code]}</span> {code}
            </>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <span aria-hidden>{CURRENCY_FLAGS[currency.code]}</span> {currency.code} ·{" "}
            {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
