"use client";

import { useQuery } from "@tanstack/react-query";
import { Combobox } from "@/components/combobox";
import { listCategories } from "@/lib/items-client";

export function CategoryPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (categoryId: string) => void;
}) {
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: listCategories });

  const options = (categories ?? []).map((c) => ({ value: c.id, label: c.path }));

  return (
    <Combobox
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Search categories…"
      emptyText="No matching category."
    />
  );
}
