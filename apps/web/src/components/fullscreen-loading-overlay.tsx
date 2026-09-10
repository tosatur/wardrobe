"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Spinner } from "@/components/ui/spinner";

/**
 * A fullscreen loading state, portalled to <body> so it escapes
 * PageTransition (every page's scrollable, animated wrapper, which gives
 * position:fixed descendants a new containing block - a plain fixed
 * overlay would otherwise render trapped below the nav instead of over
 * it, like the app's other overlays, Dialog/Popover, already portal out).
 * Gated on mount since document isn't available during SSR.
 */
export function FullscreenLoadingOverlay({ label }: { label: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount flag gating the document.body portal below, not derived from any React state
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
      <Spinner className="size-8" />
      <p className="font-mono text-xs font-bold tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
    </div>,
    document.body,
  );
}
