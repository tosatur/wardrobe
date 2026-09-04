"use client";

import { CURRENCIES } from "@wardrobe/shared";
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
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  return (
    <Select value={value} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue>{(code: string) => code}</SelectValue>
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
