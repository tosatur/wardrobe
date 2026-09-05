// The one "box" look shared by every entity detail/edit surface's popup
// frame - item detail, item new/edit, outfit detail - whether it's rendered
// as an actual Dialog (RouteModal) or inline on a plain page
// (DetailPageShell) for anyone who lands on the full-page route directly.
// Kept in one place so the two can never visually drift apart again.
//
// No top padding, deliberately: EntityToolbar is always the first thing
// inside this box and needs to sit flush against its top edge to read as
// the box's own title bar. Canceling top padding with a negative margin on
// the toolbar doesn't work here - the toolbar is `position: sticky`, and
// Chrome computes a sticky element's static (pre-scroll) position without
// applying a negative margin-top, so the box's own padding would still show
// through as a gap above it. Owning the padding at the source avoids that
// entirely; the toolbar only needs -mx-4 to bleed sideways.
//
// `pt-0` has to be explicit, not just an omitted `pt-*`: RouteModal renders
// this alongside DialogContent's own base classes, which already include a
// plain `p-4`. tailwind-merge only strips the specific sides a later
// utility names, so `px-4 pb-4` alone leaves that inherited `p-4` still
// governing the top side - only a same-specificity `pt-0` actually
// overrides it.
export const DETAIL_SURFACE_CLASS =
  "w-full rounded-xl bg-popover px-4 pt-0 pb-4 text-sm text-popover-foreground ring-1 ring-foreground/10 sm:max-w-3xl lg:max-w-5xl";
