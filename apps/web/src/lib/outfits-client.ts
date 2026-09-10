import type { CalendarWearDto, OutfitDto, OutfitQueryInput } from "@wardrobe/shared";
import { authFetch } from "./auth-client";

export type OutfitItemPlacementPayload = {
  itemId: string;
  x: number;
  y: number;
  zIndex: number;
  scale: number;
  rotation: number;
  flipX: boolean;
};

export type OutfitPayload = {
  name: string;
  description?: string;
  rating?: number | null;
  items?: OutfitItemPlacementPayload[];
  tags?: string[];
  wornDates?: string[];
};

function buildQuery(query: Partial<OutfitQueryInput>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listOutfits(query: Partial<OutfitQueryInput> = {}): Promise<OutfitDto[]> {
  const res = await authFetch(`/outfits${buildQuery(query)}`);
  if (!res.ok) throw new Error("Failed to load outfits.");
  return res.json();
}

export async function getOutfit(id: string): Promise<OutfitDto | null> {
  const res = await authFetch(`/outfits/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load outfit.");
  return res.json();
}

async function parseErrorBody(res: Response): Promise<string> {
  const body: { error?: string } = await res.json().catch(() => ({}));
  return body.error ?? "Request failed.";
}

export async function createOutfit(
  payload: OutfitPayload,
): Promise<{ data: OutfitDto | null; error: string | null }> {
  const res = await authFetch("/outfits", { method: "POST", body: JSON.stringify(payload) });
  if (!res.ok) return { data: null, error: await parseErrorBody(res) };
  return { data: await res.json(), error: null };
}

export async function updateOutfit(
  id: string,
  payload: Partial<OutfitPayload>,
): Promise<{ data: OutfitDto | null; error: string | null }> {
  const res = await authFetch(`/outfits/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { data: null, error: await parseErrorBody(res) };
  return { data: await res.json(), error: null };
}

export async function deleteOutfit(id: string): Promise<{ error: string | null }> {
  const res = await authFetch(`/outfits/${id}`, { method: "DELETE" });
  if (!res.ok) return { error: await parseErrorBody(res) };
  return { error: null };
}

export async function logWear(
  outfitId: string,
  date?: string,
): Promise<{ data: OutfitDto | null; error: string | null }> {
  const res = await authFetch(`/outfits/${outfitId}/wears`, {
    method: "POST",
    body: JSON.stringify(date ? { date } : {}),
  });
  if (!res.ok) return { data: null, error: await parseErrorBody(res) };
  return { data: await res.json(), error: null };
}

export async function listWears(range: { start: string; end: string }): Promise<CalendarWearDto[]> {
  const params = new URLSearchParams(range);
  const res = await authFetch(`/wears?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load wear history.");
  return res.json();
}

export async function uploadOutfitCoverPhoto(
  id: string,
  photo: Blob,
): Promise<{ data: OutfitDto | null; error: string | null }> {
  const formData = new FormData();
  formData.set("photo", photo, "cover.png");
  const res = await authFetch(`/outfits/${id}/photo`, { method: "POST", body: formData });
  if (!res.ok) return { data: null, error: await parseErrorBody(res) };
  return { data: await res.json(), error: null };
}
