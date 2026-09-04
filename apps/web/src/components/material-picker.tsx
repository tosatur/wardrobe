"use client";

import { useQuery } from "@tanstack/react-query";
import { MultiCombobox } from "@/components/combobox";
import { listMaterials } from "@/lib/items-client";

export function MaterialPicker({
  values,
  onChange,
}: {
  values: string[];
  onChange: (materialIds: string[]) => void;
}) {
  const { data: materials } = useQuery({ queryKey: ["materials"], queryFn: listMaterials });

  const options = (materials ?? []).map((m) => ({ value: m.id, label: m.name }));

  return (
    <MultiCombobox
      options={options}
      values={values}
      onChange={onChange}
      placeholder="Search materials…"
      emptyText="No matching material."
      max={10}
    />
  );
}
