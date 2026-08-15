import { createContext, useContext } from "react";

/** Split from the provider so that file exports only a component. */
export const SoundContext = createContext(null);

/**
 * @returns {{ play: (cue: string) => void, muted: boolean, toggleMuted: () => void }}
 */
export function useSound() {
  const context = useContext(SoundContext);
  if (!context) throw new Error("useSound must be used inside a <SoundProvider>");
  return context;
}
