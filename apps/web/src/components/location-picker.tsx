"use client";

import * as React from "react";
import type { GeocodeResultDto } from "@wardrobe/shared";
import {
  Combobox as ComboboxRoot,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { geocodeSearch } from "@/lib/weather-client";

type LocationNode = {
  key: string;
  label: string;
  result: GeocodeResultDto | null;
};

function formatResult(result: GeocodeResultDto): string {
  return [result.name, result.admin1, result.country].filter(Boolean).join(", ");
}

export function LocationPicker({
  value,
  onChange,
}: {
  /** The persisted location name, e.g. session.user.locationName. */
  value: string | null;
  onChange: (result: GeocodeResultDto) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GeocodeResultDto[]>([]);

  // Only searches once the user actually types - `query` starts empty and
  // only changes via onInputValueChange below, so this never fires just
  // because `value` was hydrated from the session on page load.
  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const handle = setTimeout(() => {
      void geocodeSearch(trimmed).then(setResults);
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  // Rendered from `query` rather than cleared via a second setState in the
  // effect above: an empty query means nothing to show, whether or not a
  // previous search's results are still sitting in state.
  const items: LocationNode[] = query.trim()
    ? results.map((result) => ({
        key: `${result.lat},${result.lon}`,
        label: formatResult(result),
        result,
      }))
    : [];

  // The persisted value has no lat/lon of its own (only its display name is
  // stored), so it's synthesized as a node with no backing result - see the
  // matching comment on the generic Combobox for why this virtual-option
  // pattern is needed instead of just passing a bare string. Memoized on
  // `value` alone: Base UI's single-select Combobox re-syncs its displayed
  // input text from a *reference* change of `value`, so recreating this
  // object on every render (e.g. as `query` changes while typing) would
  // reset the input back to the old label after every keystroke.
  const selected = React.useMemo<LocationNode | null>(
    () => (value ? { key: value, label: value, result: null } : null),
    [value],
  );

  return (
    <ComboboxRoot<LocationNode>
      items={items}
      value={selected}
      onValueChange={(next) => {
        if (next?.result) onChange(next.result);
      }}
      itemToStringLabel={(item) => item.label}
      itemToStringValue={(item) => item.key}
      isItemEqualToValue={(item, val) => item.key === val.key}
      onInputValueChange={setQuery}
      filter={() => true}
      autoHighlight
    >
      <ComboboxInput placeholder="Search for a city…" />
      <ComboboxContent>
        <ComboboxEmpty>{query.trim() ? "No matching city." : "Type to search…"}</ComboboxEmpty>
        <ComboboxList>
          {(item: LocationNode) => (
            <ComboboxItem key={item.key} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxRoot>
  );
}
