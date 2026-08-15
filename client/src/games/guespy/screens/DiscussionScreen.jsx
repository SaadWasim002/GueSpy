import { useCallback, useEffect, useState } from "react";
import { Avatar, Badge, Button, LoadingBlock, ProgressRing, RingValue, Screen } from "../../../ui";
import { cn } from "../../../lib/cn";
import { formatDuration, useCountdown } from "../../../hooks/useCountdown";
import { SpyGuessDialog } from "../components/SpyGuessDialog";
import styles from "./DiscussionScreen.module.css";

const PROMPTS = [
  "Describe it in three words — no more.",
  "Who hasn't said anything yet? Ask them.",
  "Say something only someone who knows the word would say.",
  "Name something it's often confused with.",
  "Where would you find it?",
  "Would you rather have one, or not? Why?",
  "Describe it without any of the obvious words.",
  "Ask the person on your left a direct question.",
];

/** Below this the ring turns red and starts pulsing. */
const URGENT_MS = 10_000;

/**
 * Backoff before asking again if the server still says DISCUSSION_TIME.
 *
 * Only reachable when this device's clock is ahead of the server's, so the
 * deadline passes here first. The normal path makes exactly one request.
 */
const RETRY_MS = 2000;

export function DiscussionScreen({ session }) {
  /*
   * The duration comes from the get-screen payload, not from /config/get.
   * It is the value the engine itself used to compute the deadline, so the
   * countdown and the server can no longer disagree — which they could when
   * the client read the database and the engine read its own cache.
   *
   * `discussionDuration` is in seconds.
   */
  const startedAt = session.data?.discussionStartTime ?? null;
  const durationSec = session.data?.discussionDuration ?? null;
  const players = session.data?.players ?? [];
  const startingPlayer = session.data?.startingPlayer ?? null;

  const durationMs = durationSec != null ? durationSec * 1000 : null;
  /*
   * Null means "no deadline to count down to" — an older server that does not
   * send the duration. The screen then goes straight to asking the server
   * what happens next rather than inventing a timer.
   *
   * Deliberately not `Date.now()`: that is impure in render and would produce
   * a new value every time, rescheduling the timeout below on every render
   * instead of firing it once.
   */
  const endsAt = startedAt && durationMs != null ? startedAt + durationMs : null;

  const { remainingMs, isExpired } = useCountdown(endsAt);
  const awaitingServer = endsAt === null || isExpired;

  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const [guessOpen, setGuessOpen] = useState(false);

  /*
   * There is no polling during discussion. The screen sleeps until the
   * deadline and then asks once — the server flips the game to VOTING on the
   * first get-screen call past it, and this screen unmounts.
   *
   * Nothing needs checking earlier: the countdown is now driven by the same
   * `discussionDuration` the engine used, so the two cannot drift apart.
   *
   * `attempt` only advances in the clock-skew case where this device reaches
   * the deadline first and the server still says DISCUSSION_TIME; it then
   * backs off rather than spinning.
   *
   * Depend on `refresh`, never on `session`. The session hook returns a new
   * object every render, so depending on it would re-run this effect on every
   * render — and since each run fires a refresh, which sets state, which
   * renders again, that is an unbounded request loop.
   */
  const refresh = session.refresh;
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const untilDeadline = endsAt === null ? 0 : Math.max(0, endsAt - Date.now());
    const delay = untilDeadline + (attempt > 0 ? RETRY_MS : 0);

    const id = setTimeout(async () => {
      await refresh();
      // If the game really has moved on this component is gone and the
      // update is dropped; if not, this schedules one backed-off retry.
      setAttempt((n) => n + 1);
    }, delay);

    return () => clearTimeout(id);
  }, [endsAt, attempt, refresh]);

  const nextPrompt = useCallback(() => {
    setPromptIndex((current) => (current + 1) % PROMPTS.length);
  }, []);

  if (awaitingServer) {
    return (
      <Screen center width="narrow" title="Time's up">
        <div className={styles.expired}>
          <LoadingBlock label="Bringing it to a vote…" />
        </div>
      </Screen>
    );
  }

  const urgent = remainingMs <= URGENT_MS;

  return (
    <Screen
      center
      width="reading"
      eyebrow="Discussion"
      title="Talk it out"
      subtitle="Describe the word without saying it. Somebody here is bluffing."
    >
      <div className={styles.stage}>
        <ProgressRing
          progress={durationMs ? remainingMs / durationMs : 0}
          size={220}
          thickness={12}
          urgent={urgent}
          color={urgent ? "var(--color-danger)" : undefined}
          label="Discussion time remaining"
        >
          <RingValue value={formatDuration(remainingMs)} caption="remaining" />
        </ProgressRing>

        {/* Somebody has to speak first, and a table left to decide that for
            itself stalls. The server nominates; the screen just says so. */}
        {startingPlayer ? (
          <div className={styles.starter}>
            <Avatar name={startingPlayer} size="lg" state="active" />
            <span className={styles.starterName}>{startingPlayer} starts</span>
            <span className={styles.starterHint}>
              Describe the word without saying it — then it's open to everyone.
            </span>
          </div>
        ) : null}

        {players.length > 0 ? (
          <div className={styles.roster}>
            {players.map((name) => (
              <div
                key={name}
                className={cn(styles.player, name === startingPlayer && styles.playerStarting)}
              >
                <Avatar name={name} size="md" state={name === startingPlayer ? "active" : undefined} />
                <span className={styles.playerName}>{name}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.prompt}>
          <span className={styles.promptLabel}>Stuck? Try this</span>
          <span className={styles.promptText}>{PROMPTS[promptIndex]}</span>
          <button type="button" className={styles.promptSwap} onClick={nextPrompt}>
            Another one
          </button>
        </div>

        {/*
          A spy may end the round early by naming the word — the same endpoint
          the caught-spy screen uses. It is kept quiet and secondary: reaching
          for it in front of everyone is itself a tell, which is the point.
        */}
        <Button variant="ghost" size="sm" onClick={() => setGuessOpen(true)}>
          I'm the spy — I'll call it now
        </Button>

        <p className={styles.footnote}>
          <Badge tone="neutral">{players.length} in the round</Badge>
        </p>
      </div>

      <SpyGuessDialog
        open={guessOpen}
        onClose={() => setGuessOpen(false)}
        onResolved={async () => {
          setGuessOpen(false);
          await session.refresh();
        }}
      />
    </Screen>
  );
}

export default DiscussionScreen;
