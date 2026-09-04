export type Rect = { top: number; left: number; width: number; height: number };

const THICKNESS = 1;
const PARK = 32; // px parked past the viewport edge when idle

const lineClass =
  "pointer-events-none fixed transition-[top,left,background-image] duration-300 ease-out motion-reduce:transition-none";

// A short-lived bloom, not full-length falloff: just past 10% opacity across
// the item's own span, dropping back to transparent within FADE px on each
// side rather than trailing all the way to the screen edge. Stops are plain
// px, the line's own box is exactly one viewport dimension wide/tall
// (fixed, inset to 0/100%), so px along the gradient line already lines up
// with viewport coordinates, same space `getBoundingClientRect()` returns.
const FADE = 512;
const PEAK = "color-mix(in oklab, var(--color-foreground) 10%, transparent)";

function fadeGradient(direction: "to right" | "to bottom", from: number, to: number) {
  return `linear-gradient(${direction}, transparent ${from - FADE}px, ${PEAK} ${from}px, ${PEAK} ${to}px, transparent ${to + FADE}px)`;
}

// Each line always spans the full screen in its own axis, only its
// position along the other axis moves. Not a box that shrinks to fit the
// target; a crosshair whose four lines slide to frame it. `null` parks each
// line just past its own screen edge, CSS calc()/vw/vh, not
// window.innerWidth/innerHeight, since those are unavailable during SSR
// (this renders once on the server first) and a 0-fallback would park the
// bottom/right lines near the top-left corner instead of off-screen.
function lineStyles(rect: Rect | null) {
  const top = rect ? rect.top : -PARK;
  const bottom = rect ? rect.top + rect.height : `calc(100vh + ${PARK}px)`;
  const left = rect ? rect.left : -PARK;
  const right = rect ? rect.left + rect.width : `calc(100vw + ${PARK}px)`;

  const xFade = rect ? fadeGradient("to right", rect.left, rect.left + rect.width) : "none";
  const yFade = rect ? fadeGradient("to bottom", rect.top, rect.top + rect.height) : "none";

  return {
    top: { top, left: 0, width: "100%", height: THICKNESS, backgroundImage: xFade },
    bottom: { top: bottom, left: 0, width: "100%", height: THICKNESS, backgroundImage: xFade },
    left: { top: 0, left, width: THICKNESS, height: "100%", backgroundImage: yFade },
    right: { top: 0, left: right, width: THICKNESS, height: "100%", backgroundImage: yFade },
  };
}

export function HoverReticle({ rect }: { rect: Rect | null }) {
  const s = lineStyles(rect);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40">
      <span style={s.top} className={lineClass} />
      <span style={s.bottom} className={lineClass} />
      <span style={s.left} className={lineClass} />
      <span style={s.right} className={lineClass} />
    </div>
  );
}
