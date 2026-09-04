"use client";

import * as React from "react";
import { Plus } from "lucide-react";
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
import { comboboxFilter, normalize } from "@/components/combobox-filter";

export type ComboboxOption = {
  value: string;
  label: string;
  swatch?: string;
};

type CreatableOption = ComboboxOption & { creatable?: string };

function makeFilter(showAllBeforeSearch: boolean) {
  return (item: ComboboxOption, query: string) => {
    if (!showAllBeforeSearch && query.trim() === "") return false;
    return comboboxFilter(item.label, query);
  };
}

function OptionRow({ option }: { option: CreatableOption }) {
  return (
    <>
      {option.creatable !== undefined && <Plus className="size-4 shrink-0" />}
      {option.swatch && (
        <span
          className="size-3 shrink-0 rounded-full border"
          style={{ backgroundColor: option.swatch }}
        />
      )}
      {option.label}
    </>
  );
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Search…",
  emptyText = "No results.",
  showAllBeforeSearch = true,
  allowCreate = false,
}: {
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  showAllBeforeSearch?: boolean;
  allowCreate?: boolean;
}) {
  const [query, setQuery] = React.useState("");

  // A value created on the fly (via allowCreate) has no matching option
  // until the underlying list refetches. Synthesize a virtual option for it
  // so Base UI's own `value` state agrees with what's displayed, passing a
  // bare fallback string as `inputValue` instead would desync the two, and
  // Base UI resets the input to match `value` (i.e. blanks it) on the next
  // blur/reconciliation.
  const knownOption = options.find((o) => o.value === value) ?? null;
  const selected: ComboboxOption | null = value ? (knownOption ?? { value, label: value }) : null;

  const trimmed = query.trim();
  const exactMatch = options.some((o) => normalize(o.label) === normalize(trimmed));
  const itemsForView: CreatableOption[] =
    allowCreate && trimmed !== "" && !exactMatch
      ? [...options, { value: `__create__${trimmed}`, label: `Create "${trimmed}"`, creatable: trimmed }]
      : options;

  return (
    <ComboboxRoot<CreatableOption>
      items={itemsForView}
      value={selected}
      onValueChange={(next) => {
        if (!next) return;
        onChange(next.creatable ?? next.value);
      }}
      itemToStringLabel={(item) => item.label}
      itemToStringValue={(item) => item.value}
      isItemEqualToValue={(item, val) => item.value === val.value}
      onInputValueChange={setQuery}
      filter={makeFilter(showAllBeforeSearch)}
      autoHighlight
    >
      <ComboboxInput placeholder={placeholder} />
      <ComboboxContent>
        <ComboboxEmpty>
          {showAllBeforeSearch || trimmed !== "" ? emptyText : "Type to search…"}
        </ComboboxEmpty>
        <ComboboxList>
          {(item: CreatableOption) => (
            <ComboboxItem key={item.value} value={item}>
              <OptionRow option={item} />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxRoot>
  );
}

export function MultiCombobox({
  options,
  values,
  onChange,
  placeholder = "Search…",
  emptyText = "No results.",
  showAllBeforeSearch = true,
  allowCreate = false,
  max,
}: {
  options: ComboboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  showAllBeforeSearch?: boolean;
  allowCreate?: boolean;
  max?: number;
}) {
  const [query, setQuery] = React.useState("");
  const anchor = useComboboxAnchor();

  // Same rationale as Combobox above: a value created on the fly has no
  // matching option until the list refetches, so synthesize a virtual one
  // rather than silently dropping it from the selected chips. Only safe
  // when allowCreate is set, since only then is `value` itself a
  // human-readable label (e.g. a tag name) rather than an opaque id.
  const selectedOptions: ComboboxOption[] = values.flatMap((v) => {
    const known = options.find((o) => o.value === v);
    if (known) return [known];
    return allowCreate ? [{ value: v, label: v }] : [];
  });

  const trimmed = query.trim();
  const exactMatch = options.some((o) => normalize(o.label) === normalize(trimmed));
  const alreadySelected = values.some((v) => normalize(v) === normalize(trimmed));
  const itemsForView: CreatableOption[] =
    allowCreate && trimmed !== "" && !exactMatch && !alreadySelected
      ? [...options, { value: trimmed, label: `Create "${trimmed}"`, creatable: trimmed }]
      : options;

  return (
    <ComboboxRoot<CreatableOption, true>
      items={itemsForView}
      multiple
      value={selectedOptions}
      onValueChange={(next) => {
        if (max && next.length > max) return;
        onChange(next.map((o) => o.creatable ?? o.value));
      }}
      itemToStringLabel={(item) => item.label}
      itemToStringValue={(item) => item.value}
      isItemEqualToValue={(item, val) => item.value === val.value}
      onInputValueChange={setQuery}
      filter={makeFilter(showAllBeforeSearch)}
      autoHighlight
    >
      <ComboboxChips ref={anchor}>
        {selectedOptions.map((option) => (
          <ComboboxChip key={option.value}>
            {option.swatch && (
              <span
                className="size-2.5 shrink-0 rounded-full border"
                style={{ backgroundColor: option.swatch }}
              />
            )}
            {option.label}
          </ComboboxChip>
        ))}
        <ComboboxChipsInput
          placeholder={selectedOptions.length === 0 ? placeholder : undefined}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>
          {showAllBeforeSearch || trimmed !== "" ? emptyText : "Type to search…"}
        </ComboboxEmpty>
        <ComboboxList>
          {(item: CreatableOption) => (
            <ComboboxItem key={item.value} value={item}>
              <OptionRow option={item} />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxRoot>
  );
}
