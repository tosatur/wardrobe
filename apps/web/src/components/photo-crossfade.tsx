import { cn } from "@/lib/utils";

/**
 * Swaps between an item's original and cutout photo with a crossfade
 * (Reveal tier, duration-200 ease-out - see DESIGN_SYSTEM.md §2.7) instead
 * of an abrupt src swap. Both images stay mounted, stacked, with only
 * their opacity toggling, so switching is instant (no re-fetch/flash) and
 * smooth. Falls back to a single plain image when only one photo exists,
 * since there's nothing to cross-fade between.
 *
 * Only the cutout gets breathing room (p-3) - it's a subject cut out
 * against transparency, so a little inset keeps it from touching the
 * frame's border. The original is a real photo that already fills its own
 * frame; padding it too would shrink it for no reason, so it renders
 * edge-to-edge.
 */
export function PhotoCrossfade({
  originalSrc,
  cutoutSrc,
  showOriginal,
  alt,
}: {
  originalSrc: string | null;
  cutoutSrc: string | null;
  showOriginal: boolean;
  alt: string;
}) {
  if (!originalSrc || !cutoutSrc) {
    const onlySrc = originalSrc ?? cutoutSrc;
    if (!onlySrc) return null;
    return (
      <div className={cn("size-full", onlySrc === cutoutSrc && "p-3")}>
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image */}
        <img
          src={onlySrc}
          crossOrigin="use-credentials"
          alt={alt}
          className="size-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="relative size-full">
      <div
        className={cn(
          "absolute inset-0 p-3 transition-opacity duration-200 ease-out motion-reduce:transition-none",
          showOriginal ? "opacity-0" : "opacity-100",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image */}
        <img
          src={cutoutSrc}
          crossOrigin="use-credentials"
          alt={alt}
          className="size-full object-contain"
        />
      </div>
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-200 ease-out motion-reduce:transition-none",
          showOriginal ? "opacity-100" : "opacity-0",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated, cross-origin image */}
        <img
          src={originalSrc}
          crossOrigin="use-credentials"
          alt={alt}
          className="size-full object-contain"
        />
      </div>
    </div>
  );
}
