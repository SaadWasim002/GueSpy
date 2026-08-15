import { useState } from "react";
import { Badge, Button, Card, Screen, useToast } from "../../../ui";
import { cn } from "../../../lib/cn";
import { describeStatus } from "../statusLabels";
import styles from "./GameEntryScreen.module.css";

/**
 * Shown when a player returns to a game that is already underway.
 *
 * The state lives on the server, so an interrupted game is still sitting
 * there — this is the moment to say so, rather than dropping someone back
 * into a voting screen with no idea why.
 *
 * Starting over is deliberately the quieter of the two options: it wipes a
 * game other people in the room are part way through.
 */
export function GameEntryScreen({ session, onContinue, onNewGame }) {
  const toast = useToast();
  const [resetting, setResetting] = useState(false);

  const startFresh = async () => {
    setResetting(true);
    try {
      await onNewGame();
    } catch {
      // The API client already surfaced 5xx/network faults; this covers the
      // rest so the button never stays stuck in its loading state.
      toast.error("Couldn't start a new game. Try again.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <Screen
      center
      width="reading"
      eyebrow="Welcome back"
      title="You have a game in progress"
      subtitle="Pick up where the room left off, or clear it and deal a fresh round."
    >
      <div className={styles.resume}>
        <span className={styles.choiceBody}>Currently:</span>
        <Badge tone="accent" dot>
          {describeStatus(session.status)}
        </Badge>
      </div>

      <div className={styles.choices}>
        <Card interactive onClick={onContinue} pad="lg" className={styles.choice} disabled={resetting}>
          <span className={styles.choiceIcon} aria-hidden="true">
            ▶
          </span>
          <span className={styles.choiceTitle}>Continue game</span>
          <span className={styles.choiceBody}>
            Return to exactly where the game stopped.
          </span>
        </Card>

        <Card
          interactive
          onClick={startFresh}
          pad="lg"
          className={cn(styles.choice, styles.danger)}
          disabled={resetting}
        >
          <span className={styles.choiceIcon} aria-hidden="true">
            ⟳
          </span>
          <span className={styles.choiceTitle}>{resetting ? "Starting…" : "New game"}</span>
          <span className={styles.choiceBody}>
            Discards this game and starts again from category selection.
          </span>
        </Card>
      </div>

      <Button variant="ghost" onClick={onContinue} disabled={resetting}>
        Skip — just take me to the game
      </Button>
    </Screen>
  );
}

export default GameEntryScreen;
