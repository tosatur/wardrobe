export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type Session = {
  session: { id: string; userId: string; expiresAt: string };
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "member";
    image: string | null;
    locationName: string | null;
    locationLat: number | null;
    locationLon: number | null;
    defaultCurrency: string;
  };
};

export async function authFetch(path: string, init?: RequestInit) {
  const isFormData = init?.body instanceof FormData;
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

export async function getSession(): Promise<Session | null> {
  const res = await authFetch("/api/auth/get-session");
  if (!res.ok) return null;
  const body: Session | null = await res.json();
  return body;
}

export async function signInEmail(email: string, password: string) {
  const res = await authFetch("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body: { message?: string } = await res.json().catch(() => ({}));
    return { error: body.message ?? "Login failed." };
  }
  return { error: null };
}

export async function signOut() {
  await authFetch("/api/auth/sign-out", { method: "POST" });
}

export async function createUser(email: string, password: string, name: string) {
  const res = await authFetch("/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  const body: { error?: string } = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: body.error ?? "User creation failed." };
  }
  return { error: null };
}
