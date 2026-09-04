import { authFetch } from "./auth-client";

async function parseAuthErrorBody(res: Response): Promise<string> {
  const body: { message?: string } = await res.json().catch(() => ({}));
  return body.message ?? "Request failed.";
}

async function parseErrorBody(res: Response): Promise<string> {
  const body: { error?: string } = await res.json().catch(() => ({}));
  return body.error ?? "Request failed.";
}

export async function updateProfile(data: {
  name?: string;
  locationName?: string | null;
  locationLat?: number | null;
  locationLon?: number | null;
}): Promise<{ error: string | null }> {
  const res = await authFetch("/api/auth/update-user", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) return { error: await parseAuthErrorBody(res) };
  return { error: null };
}

export async function changeEmail(newEmail: string): Promise<{ error: string | null }> {
  const res = await authFetch("/api/auth/change-email", {
    method: "POST",
    body: JSON.stringify({ newEmail }),
  });
  if (!res.ok) return { error: await parseAuthErrorBody(res) };
  return { error: null };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ error: string | null }> {
  const res = await authFetch("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) return { error: await parseAuthErrorBody(res) };
  return { error: null };
}

export async function uploadAvatar(
  file: File,
): Promise<{ data: { image: string } | null; error: string | null }> {
  const formData = new FormData();
  formData.set("photo", file);
  const res = await authFetch("/users/me/photo", { method: "POST", body: formData });
  if (!res.ok) return { data: null, error: await parseErrorBody(res) };
  return { data: await res.json(), error: null };
}
