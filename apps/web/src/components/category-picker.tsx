"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { CategoryDto } from "@wardrobe/shared";
import {
  Combobox as ComboboxRoot,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { comboboxFilter } from "@/components/combobox-filter";
import { listCategories } from "@/lib/items-client";

type CategoryNode = {
  id: string;
  name: string;
  path: string;
  depth: number;
};

// The category tree can nest arbitrarily deep, so the dropdown is built as
// a real tree (indented by depth) rather than a flat "Parent/Child" list -
// each row shows only its own name, the indentation carries the hierarchy.
// While searching, a category stays visible if it matches or any
// descendant does, so a matching child's ancestors show up for context
// even though their own names don't match the query.
function buildVisibleTree(categories: CategoryDto[], query: string): CategoryNode[] {
  const childrenOf = new Map<string | null, CategoryDto[]>();
  for (const c of categories) {
    const key = c.parentId;
    childrenOf.set(key, [...(childrenOf.get(key) ?? []), c]);
  }
  for (const list of childrenOf.values()) list.sort((a, b) => a.name.localeCompare(b.name));

  const trimmed = query.trim();

  function matches(c: CategoryDto): boolean {
    if (!trimmed) return true;
    if (comboboxFilter(c.name, trimmed)) return true;
    return (childrenOf.get(c.id) ?? []).some(matches);
  }

  const result: CategoryNode[] = [];
  function visit(c: CategoryDto, depth: number) {
    if (!matches(c)) return;
    result.push({ id: c.id, name: c.name, path: c.path, depth });
    for (const child of childrenOf.get(c.id) ?? []) visit(child, depth + 1);
  }
  for (const root of childrenOf.get(null) ?? []) visit(root, 0);

  return result;
}

export function CategoryPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (categoryId: string) => void;
}) {
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const [query, setQuery] = React.useState("");

  const all = categories ?? [];
  const visible = React.useMemo(
    () => buildVisibleTree(categories ?? [], query),
    [categories, query],
  );

  // Same reasoning as the generic Combobox: the selected category might not
  // be among the currently-visible (search-filtered) rows, so its own
  // record is looked up directly rather than found within `visible`.
  const selectedCategory = value ? (all.find((c) => c.id === value) ?? null) : null;
  const selectedNode: CategoryNode | null = value
    ? {
        id: value,
        name: selectedCategory?.name ?? value,
        path: selectedCategory?.path ?? value,
        depth: 0,
      }
    : null;

  return (
    <ComboboxRoot<CategoryNode>
      items={visible}
      value={selectedNode}
      onValueChange={(next) => next && onChange(next.id)}
      itemToStringLabel={(item) => item.path}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(item, val) => item.id === val.id}
      onInputValueChange={setQuery}
      filter={() => true}
      autoHighlight
    >
      <ComboboxInput placeholder="Search categories…" />
      <ComboboxContent>
        <ComboboxEmpty>No matching category.</ComboboxEmpty>
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
