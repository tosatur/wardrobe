"use client";

import { useQuery } from "@tanstack/react-query";
import { MultiCombobox } from "@/components/combobox";
import { listColors } from "@/lib/items-client";

export function ColorPicker({
  values,
  onChange,
}: {
  values: string[];
  onChange: (colorIds: string[]) => void;
}) {
  const { data: colors } = useQuery({ queryKey: ["colors"], queryFn: listColors });

  const options = (colors ?? []).map((c) => ({ value: c.id, label: c.name, swatch: c.hex }));

  return (
    <MultiCombobox
      options={options}
      values={values}
      onChange={onChange}
      placeholder="Search colors…"
      emptyText="No matching color."
      max={10}
    />
  );
}
