import { useState } from "react";
import { Avatar, Badge, Button, Screen, useToast } from "../../../ui";
import { startNextRound } from "../gameEngineService";
import styles from "./RoundEndScreen.module.css";

/**
 * The beat between rounds: somebody is out, and the game carries on.
 *
 * The screen deliberately does not say whether the eliminated player was a
 * spy. It cannot — the payload carries only a name — and it should not: this
 * state is reached both when an innocent is voted out and when a caught spy
 * declines to guess, so revealing it either way would leak information the
 * remaining players are supposed to be working out for themselves.
 */
export function RoundEndScreen({ session }) {
  const toast = useToast();
  const [starting, setStarting] = useState(false);

  const { eliminatedPlayerName, roundNumber } = session.data ?? {};
  const refresh = session.refresh;

  const next = async () => {
    setStarting(true);
    try {
      await startNextRound();
      await refresh();
    } catch {
      toast.error("Couldn't start the next round. Try again.");
      setStarting(false);
    }
  };

  return (
    <Screen
      center
      width="narrow"
      eyebrow={roundNumber ? `Round ${roundNumber} over` : "Round over"}
      actions={
        <Button size="lg" onClick={next} loading={starting} fullWidth pulse>
          Start the next round
        </Button>
      }
    >
      <div className={styles.out}>
        <Avatar name={eliminatedPlayerName ?? ""} size="xl" state="eliminated" />
        <span className={styles.name}>{eliminatedPlayerName}</span>
        <span className={styles.line}>has been voted out.</span>
        <Badge tone="neutral">Out of the game</Badge>
        <span className={styles.withheld}>
          Whether that was the right call stays secret. Everyone still in keeps the same word — talk
          again, then vote again.
        </span>
      </div>
    </Screen>
  );
}

export default RoundEndScreen;
