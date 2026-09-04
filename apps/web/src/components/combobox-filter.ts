// Normalizes both the query and each option's label before a substring
// match, so e.g. "a line" (typed) matches "A-line" (stored), punctuation
// and whitespace differences shouldn't matter. Passed as Base UI Combobox's
// `filter` prop, overriding its built-in matcher.
export function normalize(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function comboboxFilter(label: string, query: string): boolean {
  return normalize(label).includes(normalize(query));
}
