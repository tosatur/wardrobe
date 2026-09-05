import { useEffect, useRef, useState } from "react";

const DEFAULT_MIN_MS = 400;

/**
 * Holds a pending flag `true` for at least `minMs` after it first goes true,
 * so a Skeleton or Spinner driven directly off a query/mutation's own
 * `isPending` doesn't flash for a single frame when the response is faster
 * than that floor (a cached-adjacent query, a fast mutation) - which reads
 * as a glitch rather than a load. Going pending -> false before the floor
 * elapses is deferred until the floor is up; going false -> pending again
 * restarts the floor from that moment.
 */
export function useMinDurationPending(isPending: boolean, minMs: number = DEFAULT_MIN_MS): boolean {
  const [heldPending, setHeldPending] = useState(isPending);
  const pendingSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPending) {
      pendingSinceRef.current = Date.now();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState on isPending toggle to sync held state with input
      setHeldPending(true);
      return;
    }

    const since = pendingSinceRef.current;
    if (since === null) {
      setHeldPending(false);
      return;
    }

    const remaining = minMs - (Date.now() - since);
    if (remaining <= 0) {
      pendingSinceRef.current = null;
      setHeldPending(false);
      return;
    }

    const timer = setTimeout(() => {
      pendingSinceRef.current = null;
      setHeldPending(false);
    }, remaining);
    return () => clearTimeout(timer);
  }, [isPending, minMs]);

  return heldPending;
}
