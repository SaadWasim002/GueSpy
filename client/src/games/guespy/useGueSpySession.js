import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchScreen, resetGame } from "./gameEngineService";

/**
 * GueSpy's state adapter — the module's half of the platform's session seam.
 *
 * This game is single-device pass-and-play, so its state lives entirely on
 * the server and only ever changes because *this* client acted. That makes
 * request/response the right transport: screens call `refresh()` after an
 * action and the next state comes back. There is no second player to hear
 * from, so nothing needs pushing.
 *
 * A multiplayer game would implement this same interface over a socket and
 * the host would not notice the difference.
 */
export function useGueSpySession() {
  const [session, setSession] = useState({
    status: null,
    data: null,
    isLoading: true,
    error: null,
  });

  // Guards against a slow response overwriting a newer one — easy to hit
  // here, since a screen transition fires a refresh while one may be in
  // flight — and against setting state after unmount.
  const requestId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const id = (requestId.current += 1);
    setSession((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const screen = await fetchScreen();
      if (!mounted.current || id !== requestId.current) return;

      // The status is one field of the payload; everything else is the
      // state-specific data the matching screen renders.
      const { gameStatus, ...data } = screen;
      setSession({ status: gameStatus ?? null, data, isLoading: false, error: null });
    } catch (error) {
      if (!mounted.current || id !== requestId.current) return;
      setSession((current) => ({ ...current, isLoading: false, error }));
    }
  }, []);

  /** Wipe progress and start over. Resolves once the new state has loaded. */
  const reset = useCallback(async () => {
    await resetGame();
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /*
   * Memoised so the identity only changes when the state actually does,
   * rather than on every render.
   *
   * A warning for screens built on this: never put the whole session object
   * in an effect's dependency array when the effect calls `refresh`. A
   * refresh sets state, which changes this object, which re-runs the effect
   * — an unbounded request loop, not a poll. Depend on `refresh` itself; it
   * is a stable callback.
   */
  return useMemo(() => ({ ...session, refresh, reset }), [session, refresh, reset]);
}
