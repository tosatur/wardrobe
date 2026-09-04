import type { ReactNode } from "react";

/**
 * The gradient-scrim caption that reveals over a photo/canvas tile on hover
 * or keyboard focus - shared by ItemCard and OutfitCard so the app's two
 * primary browsing grids stay visually identical. Must be a direct child of
 * a `group relative` container.
 */
export function PhotoCaptionOverlay({ children }: { children: ReactNode }) {
  return (
    <>
      {/* A gradient darken rather than a flat one, stronger near the
          caption at the bottom, clear near the top. No blur: the photo
          itself should stay sharp, only dimmed. */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 motion-reduce:transition-none" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-3 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 motion-reduce:transition-none">
        {children}
      </div>
    </>
  );
}
