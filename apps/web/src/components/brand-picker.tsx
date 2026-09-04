"use client";

import { useQuery } from "@tanstack/react-query";
import { Combobox } from "@/components/combobox";
import { listBrands } from "@/lib/items-client";

export function BrandPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (brandName: string) => void;
}) {
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: listBrands });

  // Brand is stored/sent as a name string (the API resolves/creates it
  // server-side via find-or-create), so options use the name as both value
  // and label, no separate ID round-trip needed on the client.
  const options = (brands ?? []).map((b) => ({ value: b.name, label: b.name }));

  return (
    <Combobox
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Search or add a brand…"
      emptyText="No matching brand."
      allowCreate
    />
  );
}
