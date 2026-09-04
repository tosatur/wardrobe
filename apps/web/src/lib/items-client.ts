import type {
  BrandDto,
  CategoryDto,
  ColorDto,
  ItemDto,
  ItemQueryInput,
  MaterialDto,
} from "@wardrobe/shared";
import { authFetch } from "./auth-client";

export type ItemPayload = {
  nickname?: string;
  categoryId: string;
  brandName?: string;
  colorIds?: string[];
  materialIds?: string[];
  size?: string;
  purchaseDate?: string;
  price?: number;
  currency?: string;
  notes?: string;
  visibility?: "private" | "public";
  status?: "active" | "archived";
  tags?: string[];
};

function buildQuery(query: Partial<ItemQueryInput>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listItems(query: Partial<ItemQueryInput> = {}): Promise<ItemDto[]> {
  const res = await authFetch(`/items${buildQuery(query)}`);
  if (!res.ok) throw new Error("Failed to load items.");
  return res.json();
}

export async function getItem(id: string): Promise<ItemDto | null> {
  const res = await authFetch(`/items/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load item.");
  return res.json();
}

export async function listTags(): Promise<string[]> {
  const res = await authFetch("/tags");
  if (!res.ok) throw new Error("Failed to load tags.");
  return res.json();
}

export async function listColors(): Promise<ColorDto[]> {
  const res = await authFetch("/colors");
  if (!res.ok) throw new Error("Failed to load colors.");
  return res.json();
}

export async function listMaterials(): Promise<MaterialDto[]> {
  const res = await authFetch("/materials");
  if (!res.ok) throw new Error("Failed to load materials.");
  return res.json();
}

export async function listBrands(): Promise<BrandDto[]> {
  const res = await authFetch("/brands");
  if (!res.ok) throw new Error("Failed to load brands.");
  return res.json();
}

export async function listCategories(): Promise<CategoryDto[]> {
  const res = await authFetch("/categories");
  if (!res.ok) throw new Error("Failed to load categories.");
  return res.json();
}

async function parseErrorBody(res: Response): Promise<string> {
  const body: { error?: string } = await res.json().catch(() => ({}));
  return body.error ?? "Request failed.";
}

export async function createItem(
  payload: ItemPayload,
): Promise<{ data: ItemDto | null; error: string | null }> {
  const res = await authFetch("/items", { method: "POST", body: JSON.stringify(payload) });
  if (!res.ok) return { data: null, error: await parseErrorBody(res) };
  return { data: await res.json(), error: null };
}

export async function updateItem(
  id: string,
  payload: Partial<ItemPayload>,
): Promise<{ data: ItemDto | null; error: string | null }> {
  const res = await authFetch(`/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { data: null, error: await parseErrorBody(res) };
  return { data: await res.json(), error: null };
}

export async function deleteItem(id: string): Promise<{ error: string | null }> {
  const res = await authFetch(`/items/${id}`, { method: "DELETE" });
  if (!res.ok) return { error: await parseErrorBody(res) };
  return { error: null };
}

export async function uploadItemPhoto(
  id: string,
  file: File,
): Promise<{ data: ItemDto | null; error: string | null }> {
  const formData = new FormData();
  formData.set("photo", file);
  const res = await authFetch(`/items/${id}/photo`, { method: "POST", body: formData });
  if (!res.ok) return { data: null, error: await parseErrorBody(res) };
  return { data: await res.json(), error: null };
}
