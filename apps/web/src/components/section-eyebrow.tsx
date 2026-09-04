import type { ReactNode } from "react";

// A section eyebrow paired with a hairline rule, the organizing device for
// grouped detail sections, borrowed from how a garment care label groups its
// own printed facts (composition, size, care) under small labeled panels.
export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs font-bold tracking-widest text-muted-foreground uppercase">
        {children}
      </span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}
