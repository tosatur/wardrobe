"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Shared trigger styling for the kebab menu bottom-right of a browse-grid
 * tile (ItemCard/OutfitCard) - a dark glass button that only shows on
 * hover/focus/open, per BrowseCardShell's own hover-reveal group.
 */
export const CARD_MENU_TRIGGER_CLASSNAME =
  "absolute right-2 bottom-2 bg-background/80 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 data-popup-open:opacity-100";

/**
 * The tile shell shared by ItemCard and OutfitCard: hover/focus tracking for
 * HoverReticle, a Link wrapping the photo/canvas body, and a kebab menu slot
 * outside the Link so it isn't a button nested inside an anchor.
 */
export function BrowseCardShell({
  href,
  onHoverChange,
  className,
  linkClassName,
  menu,
  children,
}: {
  href: string;
  onHoverChange?: (el: HTMLElement | null) => void;
  className?: string;
  linkClassName?: string;
  menu: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={cn("group relative", className)}
      onMouseEnter={() => onHoverChange?.(ref.current)}
      onMouseLeave={() => onHoverChange?.(null)}
    >
      <Link
        href={href}
        className={cn("block", linkClassName)}
        onFocus={(e) => {
          // Closing the kebab dropdown or a route modal hands DOM focus back
          // to this link even when the interaction that closed it was a
          // mouse click, and a plain focus check can't tell that apart from
          // a real keyboard tab-in - so only react when the browser itself
          // considers the focus keyboard-driven.
          if (e.currentTarget.matches(":focus-visible")) onHoverChange?.(ref.current);
        }}
        onBlur={() => onHoverChange?.(null)}
      >
        {children}
      </Link>

      {menu}
    </div>
  );
}
