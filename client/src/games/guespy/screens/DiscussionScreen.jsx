import { useCallback, useEffect, useState } from "react";
import { Avatar, Badge, Button, LoadingBlock, ProgressRing, RingValue, Screen } from "../../../ui";
import { useAppConfig } from "../../../platform/config/configContext";
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

/** How often to re-check state once the clock has run out. */
const POLL_MS = 1000;

/**
 * How often to check *before* the clock runs out.
 *
 * The local countdown can disagree with the server's real deadline, and not
 * only through clock skew: `/config/get` reads `discussion_duration` from the
 * database while the engine reads it from a cache refreshed on startup or via
 * the admin API, so a value edited directly in the database leaves the two
 * disagreeing indefinitely. Observed live — the client counted down from ten
 * minutes while the server moved to voting after twenty seconds.
 *
 * A slow background check bounds that to a few seconds instead of leaving the
 * room staring at a timer for a phase that has already ended.
 */
const IDLE_POLL_MS = 10_000;

export function DiscussionScreen({ session }) {
  const { settings } = useAppConfig();

  const startedAt = session.data?.discussionStartTime ?? null;
  const players = session.data?.players ?? [];
  const durationMs = (settings.discussionDuration ?? 180) * 1000;
  const endsAt = startedAt ? startedAt + durationMs : null;

  const { remainingMs, isExpired } = useCountdown(endsAt);

  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const [guessOpen, setGuessOpen] = useState(false);

  /*
   * The clock is advisory; the server decides when discussion is over. Its
   * get-screen handler flips the game to VOTING on the first call after the
   * deadline, so once the local clock runs out this just asks until the
   * answer changes.
   *
   * That also absorbs clock skew between this device and the server, which
   * is otherwise unfixable — the payload carries a start time but no server
   * "now" to calibrate against.
   *
   * Depend on `refresh`, never on `session`. The session hook returns a new
   * object every render, so depending on it re-runs this effect on every
   * render — and since each run fires a refresh, which sets state, which
   * renders again, that is an unbounded request loop rather than a poll.
   * `refresh` is a stable callback, so this starts exactly once.
   */
  const refresh = session.refresh;
  const pollMs = isExpired ? POLL_MS : IDLE_POLL_MS;

  useEffect(() => {
    // Once the local clock is out, ask immediately as well as on the
    // interval rather than waiting out the first tick.
    if (isExpired) refresh();

    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [isExpired, pollMs, refresh]);

  const nextPrompt = useCallback(() => {
    setPromptIndex((current) => (current + 1) % PROMPTS.length);
  }, []);

  if (isExpired) {
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

        {players.length > 0 ? (
          <div className={styles.roster}>
            {players.map((name) => (
              <div key={name} className={styles.player}>
                <Avatar name={name} size="md" />
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
