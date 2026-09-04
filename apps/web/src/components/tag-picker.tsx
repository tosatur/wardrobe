"use client";

import { useQuery } from "@tanstack/react-query";
import { MultiCombobox } from "@/components/combobox";
import { listTags } from "@/lib/items-client";

export function TagPicker({
  values,
  onChange,
  max = 20,
  placeholder = "Add a tag…",
}: {
  values: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  placeholder?: string;
}) {
  const { data: tags } = useQuery({ queryKey: ["tags"], queryFn: listTags });

  const options = (tags ?? []).map((t) => ({ value: t, label: t }));

  return (
    <MultiCombobox
      options={options}
      values={values}
      onChange={onChange}
      placeholder={placeholder}
      emptyText="No matching tag."
      showAllBeforeSearch={false}
      allowCreate
      max={max}
    />
  );
}
