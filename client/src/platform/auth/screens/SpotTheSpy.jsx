import { useCallback, useState } from "react";
import { motion } from "motion/react";
import { Avatar, Badge } from "../../../ui";
import { cn } from "../../../lib/cn";
import styles from "./SpotTheSpy.module.css";

const NAME_POOL = [
  "Sayam", "Sunny", "Sarah", "Aarib", "Mira", "Devan", "Noor", "Idris",
  "Zoya", "Kabir", "Rhea", "Faiz", "Anya", "Omar", "Tara", "Bilal",
];

const SUSPECT_COUNT = 4;

function drawRound() {
  const shuffled = [...NAME_POOL].sort(() => Math.random() - 0.5);
  return {
    suspects: shuffled.slice(0, SUSPECT_COUNT),
    spyIndex: Math.floor(Math.random() * SUSPECT_COUNT),
  };
}

/**
 * A one-tap round of the game, played on the sign-in screen.
 *
 * The auth page is mostly empty space next to a short form, and a party game
 * should demonstrate itself rather than describe itself. Entirely local — no
 * account, no backend — so it works before anyone has signed up.
 */
export function SpotTheSpy() {
  const [round, setRound] = useState(drawRound);
  const [picked, setPicked] = useState(null);
  const [streak, setStreak] = useState(0);

  const isRevealed = picked !== null;
  const isCorrect = picked === round.spyIndex;

  const pick = useCallback(
    (index) => {
      if (picked !== null) return;
      setPicked(index);
      setStreak((current) => (index === round.spyIndex ? current + 1 : 0));
    },
    [picked, round.spyIndex],
  );

  const playAgain = useCallback(() => {
    setRound(drawRound());
    setPicked(null);
  }, []);

  return (
    <div className={styles.teaser}>
      <div className={styles.head}>
        <Badge tone="accent">Warm-up</Badge>
        <span className={styles.prompt}>One of them is the spy.</span>
        {streak > 1 ? <span className={styles.streak}>{streak} in a row</span> : null}
      </div>

      <div className={styles.row}>
        {round.suspects.map((name, index) => {
          const isSpy = index === round.spyIndex;

          return (
            <motion.button
              key={`${round.suspects.join()}-${name}`}
              type="button"
              className={cn(
                styles.suspect,
                isRevealed && isSpy && styles.spy,
                isRevealed && !isSpy && styles.clean,
                picked === index && styles.picked,
              )}
              onClick={() => pick(index)}
              disabled={isRevealed}
              aria-label={isRevealed ? `${name} — ${isSpy ? "the spy" : "innocent"}` : `Accuse ${name}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 400, damping: 30 }}
            >
              <Avatar
                name={name}
                size="md"
                badge={isRevealed && isSpy ? "🕵" : undefined}
                ringColor={isRevealed && isSpy ? "var(--color-role-hidden)" : undefined}
              />
              <span className={styles.name}>{name}</span>
            </motion.button>
          );
        })}
      </div>

      <div className={styles.verdict} aria-live="polite">
        {!isRevealed ? (
          <span>Pick the one you'd vote out.</span>
        ) : isCorrect ? (
          <span className={styles.hit}>Caught them. You'd survive round one.</span>
        ) : (
          <span className={styles.miss}>
            Wrong — {round.suspects[round.spyIndex]} was the spy.
          </span>
        )}

        {isRevealed ? (
          <button type="button" className={styles.again} onClick={playAgain}>
            Again
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default SpotTheSpy;
