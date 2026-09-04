import { describe, expect, it } from "vitest";
import { ItemCreateSchema, ItemQuerySchema, ItemUpdateSchema } from "./item.js";

describe("ItemCreateSchema", () => {
  it("accepts a minimal valid item", () => {
    const result = ItemCreateSchema.safeParse({ categoryId: "cat_shoes" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visibility).toBe("private");
      expect(result.data.colorIds).toEqual([]);
      expect(result.data.materialIds).toEqual([]);
      expect(result.data.tags).toEqual([]);
    }
  });

  it("accepts a fully populated item", () => {
    const result = ItemCreateSchema.safeParse({
      nickname: "Rainy day jacket",
      categoryId: "cat_dress_aline",
      brandName: "Acme",
      colorIds: ["color_black", "color_white"],
      materialIds: ["mat_cotton"],
      size: "M",
      purchaseDate: "2024-01-15",
      price: 129.99,
      notes: "Winter jacket",
      visibility: "public",
      tags: ["winter", "formal"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing categoryId", () => {
    const result = ItemCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects an empty-string categoryId", () => {
    const result = ItemCreateSchema.safeParse({ categoryId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative price", () => {
    const result = ItemCreateSchema.safeParse({ categoryId: "cat_shoes", price: -5 });
    expect(result.success).toBe(false);
  });

  it("rejects a nickname over the length limit", () => {
    const result = ItemCreateSchema.safeParse({
      categoryId: "cat_shoes",
      nickname: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes over the length limit", () => {
    const result = ItemCreateSchema.safeParse({
      categoryId: "cat_shoes",
      notes: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 20 tags", () => {
    const result = ItemCreateSchema.safeParse({
      categoryId: "cat_shoes",
      tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 colorIds", () => {
    const result = ItemCreateSchema.safeParse({
      categoryId: "cat_shoes",
      colorIds: Array.from({ length: 11 }, (_, i) => `color${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 materialIds", () => {
    const result = ItemCreateSchema.safeParse({
      categoryId: "cat_shoes",
      materialIds: Array.from({ length: 11 }, (_, i) => `mat${i}`),
    });
    expect(result.success).toBe(false);
  });
});

describe("ItemUpdateSchema", () => {
  it("accepts a partial update with a single field", () => {
    const result = ItemUpdateSchema.safeParse({ notes: "updated" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object", () => {
    const result = ItemUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("still rejects an invalid field value when present", () => {
    const result = ItemUpdateSchema.safeParse({ price: -1 });
    expect(result.success).toBe(false);
  });

  it("does not fill in defaults for fields the client didn't send (regression: partial update must not reset colorIds/materialIds/visibility/tags)", () => {
    const result = ItemUpdateSchema.safeParse({ notes: "updated" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("colorIds");
      expect(result.data).not.toHaveProperty("materialIds");
      expect(result.data).not.toHaveProperty("visibility");
      expect(result.data).not.toHaveProperty("tags");
      expect(result.data.notes).toBe("updated");
    }
  });
});

describe("ItemQuerySchema", () => {
  it("accepts an empty query", () => {
    expect(ItemQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts a combination of filters", () => {
    const result = ItemQuerySchema.safeParse({
      categoryId: "cat_shoes",
      brandId: "brand_nike",
      colorId: "color_black",
      materialId: "mat_cotton",
      tag: "summer",
      q: "sneakers",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty-string categoryId filter", () => {
    const result = ItemQuerySchema.safeParse({ categoryId: "" });
    expect(result.success).toBe(false);
  });
});
