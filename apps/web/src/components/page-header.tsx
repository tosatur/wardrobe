import type { ReactNode } from "react";

/**
 * The page-level <h1>, shared by every authenticated route so the heading
 * scale and (where present) the giant background watermark stay identical
 * everywhere instead of being hand-copied per page. `watermark` is reserved
 * for the three primary Library sections (Closet, Outfits, Calendar).
 */
export function PageHeader({
  title,
  watermark,
  actions,
}: {
  title: ReactNode;
  watermark?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="relative mb-6 overflow-hidden">
      {watermark && (
        <p
          aria-hidden
          className="pointer-events-none absolute -top-10 -left-2 bg-linear-to-r from-foreground/25 to-foreground/5 bg-clip-text font-heading text-[7rem] leading-none font-black tracking-tighter text-transparent select-none sm:text-[9rem]"
        >
          {watermark}
        </p>
      )}
      <div className="relative flex items-center justify-between gap-4 pt-2">
        <h1 className="font-heading text-3xl font-black tracking-tight uppercase">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
