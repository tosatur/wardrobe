"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AuthStatus } from "@/components/auth-status";
import { getSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();
  // Shares the "session" query cache with AuthStatus (and every other page
  // that reads it) rather than fetching independently - a local fetch-once
  // effect here would miss the login/logout that just happened elsewhere in
  // the same client-side session, since this component never remounts
  // across client-side navigation.
  const { data: session, isPending } = useQuery({ queryKey: ["session"], queryFn: getSession });

  if (isPending || !session) {
    return null;
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function linkClassName(href: string) {
    return cn(
      // text-foreground/85 rather than text-muted-foreground: the header's
      // translucent glass background (deliberately not opaque, see its own
      // comment above) lets the page's own light-mode color bleed through
      // the blur, which washes out muted-foreground's flatter gray past
      // legibility. A fraction of the strong (near-white, dark-scoped)
      // foreground token holds contrast in both themes instead. /85, not
      // /70 - against a light-theme page the glass wash reads lighter, and
      // /70 dropped inactive links below a readable contrast ratio there.
      "transition-colors hover:text-foreground",
      isActive(href) ? "text-foreground" : "text-foreground/85",
    );
  }

  return (
    // Scoped to the dark theme regardless of the page's own light/dark
    // mode, the reference's dark panel as a fixed structural rail, not a
    // themed surface. Every descendant (AuthStatus's buttons, the dropdown)
    // picks up correct dark styling automatically via the scoped tokens.
    // Sticky + a translucent neutral gradient + backdrop-blur so it reads as
    // glass floating over the page rather than a flat opaque bar, the blur
    // only does anything once there's scrolling content underneath it. The
    // wash is graphite (foreground/background), not navy, navy stays a
    // deliberate accent (the wordmark's dot, links, focus) rather than a
    // color smeared across the whole rail. Kept genuinely translucent
    // (45%/30%, not 85%/70%) so the page's own color shows through the
    // blur in light mode too, at near-opaque it just read as a flat dark
    // bar over a bright page, not glass. The inset top highlight is the
    // usual glass-panel tell: a light catching the pane's top edge.
    <header className="dark sticky top-0 z-50 border-b border-foreground/10 bg-linear-to-b from-foreground/10 via-background/45 to-background/30 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <nav className="flex items-center gap-6 font-mono text-xs font-bold tracking-wider uppercase">
          <Link href="/" className="font-heading text-lg font-black tracking-tight">
            Wardrobe<span className="font-mono text-primary">.</span>
          </Link>
          <Link href="/items" className={linkClassName("/items")}>
            Closet
          </Link>
          <Link href="/outfits" className={linkClassName("/outfits")}>
            Outfits
          </Link>
          <Link href="/calendar" className={linkClassName("/calendar")}>
            Calendar
          </Link>
          {session.user.role === "admin" && (
            <Link href="/admin" className={linkClassName("/admin")}>
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
