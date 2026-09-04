"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Combobox as ComboboxRoot,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { buildVisibleTree, type CategoryNode } from "@/components/category-picker";
import { listCategories } from "@/lib/items-client";

export function CategoryMultiPicker({
  values,
  onChange,
  placeholder = "Search categories…",
}: {
  values: string[];
  onChange: (categoryIds: string[]) => void;
  placeholder?: string;
}) {
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const [query, setQuery] = React.useState("");
  const anchor = useComboboxAnchor();

  const all = categories ?? [];
  const visible = React.useMemo(
    () => buildVisibleTree(categories ?? [], query),
    [categories, query],
  );

  // Same reasoning as the generic MultiCombobox: a selected category might
  // not be among the currently-visible (search-filtered) rows, so each
  // selected id is looked up directly rather than found within `visible`.
  const selectedNodes: CategoryNode[] = values.flatMap((id) => {
    const category = all.find((c) => c.id === id);
    return category ? [{ id: category.id, name: category.name, path: category.path, depth: 0 }] : [];
  });

  return (
    <ComboboxRoot<CategoryNode, true>
      items={visible}
      multiple
      value={selectedNodes}
      onValueChange={(next) => onChange(next.map((n) => n.id))}
      itemToStringLabel={(item) => item.path}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(item, val) => item.id === val.id}
      onInputValueChange={setQuery}
      filter={() => true}
      autoHighlight
    >
      <ComboboxChips ref={anchor}>
        {selectedNodes.map((node) => (
          <ComboboxChip key={node.id}>{node.name}</ComboboxChip>
        ))}
        <ComboboxChipsInput placeholder={selectedNodes.length === 0 ? placeholder : undefined} />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{query.trim() ? "No matching category." : "Type to search…"}</ComboboxEmpty>
        <ComboboxList>
          {(item: CategoryNode) => (
            <ComboboxItem key={item.id} value={item} style={{ paddingLeft: `${0.375 + item.depth}rem` }}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxRoot>
  );
}
