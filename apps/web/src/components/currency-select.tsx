"use client";

import { CURRENCIES, currencyNarrowSymbol, type CurrencyCode } from "@wardrobe/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CurrencySelect({
  value,
  onChange,
  id,
  variant = "default",
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  /** "addon" renders a compact, symbol-only trigger for pairing with an Input in a ButtonGroup. */
  variant?: "default" | "addon";
}) {
  return (
    <Select value={value} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger
        id={id}
        className={variant === "addon" ? "min-w-14 justify-center" : "w-full"}
      >
        {variant === "addon" ? (
          currencyNarrowSymbol(value)
        ) : (
          <SelectValue>{(code: CurrencyCode) => code}</SelectValue>
        )}
      </SelectTrigger>
      <SelectContent
        align={variant === "addon" ? "start" : undefined}
        alignItemWithTrigger={variant === "addon" ? false : undefined}
        className={
          variant === "addon"
            ? "w-min min-w-[var(--radix-select-trigger-width)]"
            : undefined
        }
      >
        {CURRENCIES.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.code} · {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
