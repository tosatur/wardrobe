import type { ItemDto } from "@wardrobe/shared";

export type ItemSortOrder = "newest" | "oldest" | "name-asc" | "name-desc";

export function sortItems(items: ItemDto[], order: ItemSortOrder): ItemDto[] {
  const sorted = [...items];
  const label = (item: ItemDto) => item.nickname ?? item.category.name;
  switch (order) {
    case "newest":
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "oldest":
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "name-asc":
      return sorted.sort((a, b) => label(a).localeCompare(label(b)));
    case "name-desc":
      return sorted.sort((a, b) => label(b).localeCompare(label(a)));
  }
}
