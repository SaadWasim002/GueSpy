import { useCallback, useMemo, useState } from "react";
import { play as playCue, setMuted as setEngineMuted } from "../../lib/sound";
import { readStorage, writeStorage } from "../../lib/storage";
import { SoundContext } from "./soundContext";

const STORAGE_KEY = "muted";

/*
 * Read the preference at module load so the very first cue already respects
 * it, and push it into the audio engine before any component renders.
 *
 * Sound is on by default: this is a party game played out loud on a shared
 * device, and a cue nobody can discover is a feature nobody has. Muting is
 * one tap in the header and it sticks.
 */
const INITIAL_MUTED = readStorage(STORAGE_KEY) === "true";
setEngineMuted(INITIAL_MUTED);

export function SoundProvider({ children }) {
  const [muted, setMuted] = useState(INITIAL_MUTED);

  /*
   * The side effects live here, not inside a state updater.
   *
   * React may invoke an updater twice to check it is pure, and it does so in
   * development — which played the confirmation cue twice and wrote storage
   * twice. Deriving `next` from the current render's `muted` keeps the
   * updater a plain value and the effects happening exactly once.
   */
  const toggleMuted = useCallback(() => {
    const next = !muted;
    setMuted(next);
    setEngineMuted(next);
    writeStorage(STORAGE_KEY, String(next));
    // Confirm un-muting audibly — otherwise the only feedback for turning
    // sound back on is silence.
    if (!next) playCue("tap");
  }, [muted]);

  const value = useMemo(
    () => ({ play: playCue, muted, toggleMuted }),
    [muted, toggleMuted],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export default SoundProvider;
