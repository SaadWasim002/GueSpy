import { useState } from "react";
import { Avatar, Badge, Button, Screen, useToast } from "../../../ui";
import { SpyGuessDialog } from "../components/SpyGuessDialog";
import { declineSpyGuess } from "../gameEngineService";
import styles from "./SpyGuessScreen.module.css";

/**
 * A spy has been voted out and gets one chance to steal the round by naming
 * the word.
 *
 * The word is never on this screen — and here that is the server's doing as
 * well as ours: the SPY_GUESS payload carries only the caught spy's name, the
 * category and the round number. The word appears for the first time on the
 * result screen.
 */
export function SpyGuessScreen({ session }) {
  const toast = useToast();
  const [guessOpen, setGuessOpen] = useState(false);
  const [declining, setDeclining] = useState(false);

  const { caughtSpyName, categoryName, roundNumber } = session.data ?? {};
  const refresh = session.refresh;

  const decline = async () => {
    setDeclining(true);
    try {
      await declineSpyGuess();
      await refresh();
    } catch {
      toast.error("Couldn't pass. Try again.");
      setDeclining(false);
    }
  };

  return (
    <Screen
      center
      width="reading"
      eyebrow={roundNumber ? `Round ${roundNumber}` : "Caught"}
      title="The spy is out"
      subtitle="One chance to turn it around: name the word, and the spies take the round anyway."
      actions={
        <>
          <Button variant="secondary" size="lg" onClick={decline} loading={declining}>
            Don't risk it
          </Button>
          <Button size="lg" onClick={() => setGuessOpen(true)} disabled={declining} pulse>
            Guess the word
          </Button>
        </>
      }
      secondary={
        // The three outcomes, spelled out. Useful the first few times a group
        // plays and ignorable after, so they sit under the decision rather
        // than pushing it off the screen.
        <div className={styles.stakes}>
          <div className={styles.stake}>
            <span className={styles.stakeTitle}>Guess right</span>
            <span className={styles.stakeBody}>
              The spies win the round outright, even though they were caught.
            </span>
          </div>
          <div className={styles.stake}>
            <span className={styles.stakeTitle}>Guess wrong</span>
            <span className={styles.stakeBody}>
              It's over — the innocents take it. No second attempt.
            </span>
          </div>
          <div className={styles.stake}>
            <span className={styles.stakeTitle}>Don't risk it</span>
            <span className={styles.stakeBody}>
              {caughtSpyName ?? "The spy"} is out of the game. If another spy is still hidden, the
              round goes on without them.
            </span>
          </div>
        </div>
      }
    >
      <div className={styles.caught}>
        <Avatar name={caughtSpyName ?? ""} size="xl" ringColor="var(--color-role-hidden)" badge="🕵" />
        <span className={styles.name}>{caughtSpyName}</span>
        <span className={styles.line}>
          was the spy — and the room got them.
        </span>
        {categoryName ? <Badge tone="neutral">Category: {categoryName}</Badge> : null}
      </div>

      <SpyGuessDialog
        open={guessOpen}
        onClose={() => setGuessOpen(false)}
        categoryName={categoryName}
        title="Name the word"
        description="Get it right and the spies take the round despite being caught. Get it wrong and it's over."
        onResolved={async () => {
          setGuessOpen(false);
          await refresh();
        }}
      />
    </Screen>
  );
}

export default SpyGuessScreen;
