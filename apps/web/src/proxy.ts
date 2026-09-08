import { NextResponse, type NextRequest } from "next/server";

// Server-side fetches need the API's own network address, not the
// browser-facing one: docker-compose already sets API_URL to the internal
// "http://api:3001" for the web container. NEXT_PUBLIC_API_URL is a
// fallback for anyone who only set the browser-facing var, and
// "127.0.0.1" (not "localhost") avoids environments where Node's fetch
// resolves "localhost" to ::1 ahead of the API's IPv4-only listener.
const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001";

const PUBLIC_PATHS = ["/login", "/register"];

// Every page in this app is a client component that fetches its own
// session and only then decides what to render, so an unauthenticated
// visit to a protected route used to render the full page shell before
// failing to load any data. This proxy only handles the redirect - the
// API remains the actual authority on every request it serves.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const cookie = request.headers.get("cookie");
  const sessionRes = await fetch(`${API_URL}/api/auth/get-session`, {
    headers: cookie ? { cookie } : {},
  }).catch(() => null);

  // This proxy runs for every request AND every Link prefetch (the calendar
  // grid alone fires dozens at once), all of which hit the API from this
  // single container's IP - easily enough to trip the API's per-IP auth
  // rate limit. A non-ok response here (429, a transient 5xx, or the fetch
  // itself failing) is inconclusive, not proof the visitor is logged out,
  // so it must not be treated the same as a real "no session" answer -
  // otherwise a signed-in user gets bounced to the login screen whenever a
  // burst of prefetches happens to collide with a real navigation. Only a
  // successful response is authoritative; anything else falls through to
  // the API's own per-request auth checks, which remain the real authority.
  if (!sessionRes || !sessionRes.ok) {
    return NextResponse.next();
  }
  const session = await sessionRes.json().catch(() => null);

  if (isPublicPath) {
    // A signed-in user has no reason to see the login or register form -
    // send them back to the app instead of leaving both reachable at once.
    return session
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (session) {
    return NextResponse.next();
  }

  // Registration only stays open until the first (admin) account exists,
  // so an unauthenticated visitor should land on /register rather than a
  // /login form for an account nobody has created yet.
  const healthRes = await fetch(`${API_URL}/health`).catch(() => null);
  const health: { userCount?: number } | null = healthRes?.ok
    ? await healthRes.json().catch(() => null)
    : null;
  const destination = health?.userCount === 0 ? "/register" : "/login";

  return NextResponse.redirect(new URL(destination, request.url));
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
