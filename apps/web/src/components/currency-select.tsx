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
        <SelectValue>{(code: CurrencyCode) => code}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.code} · {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
