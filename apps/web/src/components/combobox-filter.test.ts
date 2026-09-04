import { describe, expect, it } from "vitest";
import { comboboxFilter, normalize } from "./combobox-filter.js";

describe("normalize", () => {
  it("lowercases and strips non-alphanumeric characters", () => {
    expect(normalize("A-line")).toBe("aline");
    expect(normalize("a line")).toBe("aline");
    expect(normalize("Dress/A-line")).toBe("dressaline");
  });
});

describe("comboboxFilter", () => {
  it("matches 'a line' (typed) against 'A-line' (stored): the exact case this exists for", () => {
    expect(comboboxFilter("A-line", "a line")).toBe(true);
  });

  it("matches regardless of hyphen/space/case differences either direction", () => {
    expect(comboboxFilter("Sky Blue", "skyblue")).toBe(true);
    expect(comboboxFilter("Spandex/Elastane", "elastane")).toBe(true);
  });

  it("matches a full display path by its leaf name", () => {
    expect(comboboxFilter("Dress/A-line", "a line")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(comboboxFilter("A-line", "denim jacket")).toBe(false);
  });

  it("matches everything against an empty search", () => {
    expect(comboboxFilter("A-line", "")).toBe(true);
  });
});
