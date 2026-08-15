import { useEffect, useState } from "react";

/**
 * Count down to an absolute timestamp.
 *
 * Derives the remaining time from `Date.now()` on every tick rather than
 * decrementing a counter, so it stays correct across a backgrounded tab, a
 * sleeping device, or a throttled timer — all of which a phone being passed
 * around a room does constantly. A decrementing counter would silently run
 * slow in exactly those cases.
 *
 * @param {number|null} endsAt  epoch ms, or null to idle
 * @param {number} tickMs       how often to re-read the clock
 * @returns {{ remainingMs: number, isExpired: boolean }}
 */
export function useCountdown(endsAt, tickMs = 250) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return undefined;

    const tick = () => setNow(Date.now());

    // Resync immediately as well as on the interval, in case `endsAt`
    // arrived long after mount and the stored `now` has gone stale. Deferred
    // rather than called inline, so the effect body itself sets no state.
    const immediate = setTimeout(tick, 0);
    const id = setInterval(tick, tickMs);

    return () => {
      clearTimeout(immediate);
      clearInterval(id);
    };
  }, [endsAt, tickMs]);

  if (!endsAt) return { remainingMs: 0, isExpired: false };

  const remainingMs = Math.max(0, endsAt - now);
  return { remainingMs, isExpired: remainingMs <= 0 };
}

/** Format milliseconds as m:ss. */
export function formatDuration(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
