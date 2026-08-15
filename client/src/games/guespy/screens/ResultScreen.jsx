import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Avatar, Badge, Button, Confetti, Screen, useToast } from "../../../ui";
import { cn } from "../../../lib/cn";
import { useSound } from "../../../platform/sound/soundContext";
import styles from "./ResultScreen.module.css";

const formatScore = (score) => (score > 0 ? `+${score}` : `${score}`);

const scoreTone = (score) => {
  if (score > 0) return styles.positive;
  if (score < 0) return styles.negative;
  return styles.zero;
};

/**
 * The payoff: who won, who the spies were, what the word was, and where
 * everyone finished.
 *
 * This is the only screen that ever shows the word, and the only one that
 * names the spies — everything the rest of the game works to keep hidden
 * lands here at once.
 */
export function ResultScreen({ session }) {
  const toast = useToast();
  const { play } = useSound();
  const [resetting, setResetting] = useState(false);

  const { winner, word, spies = [], scores = [], roundNumber } = session.data ?? {};
  const spiesWon = winner === "SPY";

  // The game is over and everything is on screen, so the cue can differ by
  // outcome — there is nothing left to give away.
  useEffect(() => {
    play(spiesWon ? "spyWin" : "win");
  }, [play, spiesWon]);

  // Ranked highest first. Sorted from a copy — `scores` belongs to session
  // state and sorting in place would mutate it.
  const ranked = useMemo(
    () => [...scores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [scores],
  );

  const topScore = ranked[0]?.score;
  const spyNames = new Set(spies);

  const newGame = async () => {
    setResetting(true);
    try {
      await session.reset();
    } catch {
      toast.error("Couldn't start a new game. Try again.");
      setResetting(false);
    }
  };

  return (
    <Screen
      width="reading"
      eyebrow={roundNumber ? `${roundNumber} round${roundNumber === 1 ? "" : "s"}` : "Game over"}
      actions={
        <>
          <Button variant="ghost" size="lg" as={Link} to="/">
            All games
          </Button>
          <Button size="lg" onClick={newGame} loading={resetting} pulse>
            Play again
          </Button>
        </>
      }
      secondary={
        // The headline is who won, the word and the spies; the table is the
        // detail people pore over afterwards. Below the fold so "play again"
        // is reachable the moment the result lands.
        <div className={styles.board}>
          <div className={styles.boardHead}>
            <h2 className={styles.boardTitle}>Final scores</h2>
            <span className={styles.boardNote}>spies score for every round they survived</span>
          </div>

          {ranked.map((player, index) => (
            <motion.div
              key={player.playerNumber ?? player.playerName}
              className={cn(styles.row, player.score === topScore && styles.leader)}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 * index, type: "spring", stiffness: 420, damping: 34 }}
            >
              <span className={styles.rank}>{index + 1}</span>
              <Avatar name={player.playerName} size="sm" />
              <span className={styles.rowName}>{player.playerName}</span>
              {spyNames.has(player.playerName) ? <Badge tone="danger">Spy</Badge> : null}
              <span className={cn(styles.score, scoreTone(player.score ?? 0))}>
                {formatScore(player.score ?? 0)}
              </span>
            </motion.div>
          ))}
        </div>
      }
    >
      <Confetti />

      <div className={cn(styles.banner, spiesWon ? styles.spyWin : styles.crewWin)}>
        <span className={styles.headline}>
          {spiesWon ? "The spies win" : "The innocents win"}
        </span>
        <span className={styles.subline}>
          {spiesWon
            ? "Nobody pinned them down in time."
            : "The room worked it out and shut it down."}
        </span>
      </div>

      <div className={styles.reveals}>
        <div className={styles.reveal}>
          <span className={styles.revealLabel}>The word was</span>
          <span className={styles.word}>{word}</span>
        </div>

        <div className={styles.reveal}>
          <span className={styles.revealLabel}>
            {spies.length === 1 ? "The spy" : "The spies"}
          </span>
          <div className={styles.spyList}>
            {spies.length > 0 ? (
              spies.map((name) => (
                <span key={name} className={styles.spyChip}>
                  <Avatar name={name} size="xs" />
                  {name}
                </span>
              ))
            ) : (
              <span className={styles.revealLabel}>Not recorded</span>
            )}
          </div>
        </div>
      </div>

    </Screen>
  );
}

export default ResultScreen;
