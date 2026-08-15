import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, Badge, Button, EmptyState, LoadingBlock, Screen, useToast } from "../../../ui";
import { cn } from "../../../lib/cn";
import { useSound } from "../../../platform/sound/soundContext";
import { fetchRoleReveal } from "../gameEngineService";
import styles from "./RevealScreen.module.css";

/**
 * The face-down role card. Hold to look, release to hide.
 *
 * Hold rather than tap because the whole point is that nobody else sees it:
 * a tapped card stays open if the player is startled or looks up, while a
 * held one closes the instant they let go. Keyboard gets the same contract —
 * hold space or enter — rather than a toggle that would behave differently.
 */
function RoleCard({ isSpy, word, categoryName, revealed, onRevealChange }) {
  const show = () => onRevealChange(true);
  const hide = () => onRevealChange(false);

  return (
    <button
      type="button"
      className={cn(styles.card, revealed && styles.revealed)}
      onPointerDown={(event) => {
        // Capture so a finger sliding off the card still releases it here.
        event.currentTarget.setPointerCapture?.(event.pointerId);
        show();
      }}
      onPointerUp={hide}
      onPointerCancel={hide}
      onKeyDown={(event) => {
        if ((event.key === " " || event.key === "Enter") && !event.repeat) {
          event.preventDefault();
          show();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") hide();
      }}
      onBlur={hide}
      aria-pressed={revealed}
      aria-label={revealed ? "Your role, revealed" : "Hold to reveal your role"}
    >
      <span className={styles.inner}>
        <span className={cn(styles.face, styles.back)}>
          <span className={styles.backGlyph} aria-hidden="true">
            🂠
          </span>
          <span className={styles.backLabel}>Hold to reveal</span>
          <span className={styles.backHint}>Let go and it hides again.</span>
        </span>

        <span className={cn(styles.face, styles.front, isSpy ? styles.hidden : styles.crew)}>
          {isSpy ? (
            <>
              <span className={styles.roleLabel}>You are the SPY</span>
              <span className={styles.categoryLabel}>{categoryName}</span>
              {/*
                The word is deliberately not rendered on this branch. The
                server sends `wordName` on every response, a spy's included,
                so keeping the two branches separate is what stops it
                reaching the screen.
              */}
              <span className={styles.spyBrief}>
                You don't get the word. Work out what everyone else is describing — and describe it
                back convincingly.
              </span>
            </>
          ) : (
            <>
              <span className={styles.roleLabel}>You're not the spy</span>
              <span className={styles.categoryLabel}>{categoryName}</span>
              <span className={styles.word}>{word}</span>
            </>
          )}
        </span>
      </span>
    </button>
  );
}

/**
 * The pass-the-device pass: each player takes the device, sees their role
 * privately, and hands it on.
 *
 * The endpoint driving this is a GET that mutates — every call advances the
 * server's cursor and there is no way to re-read the current screen. So this
 * screen is built around calling it exactly once per screen shown:
 *
 *   - the first call is guarded by a ref, not just an empty dep array,
 *     because StrictMode runs effects twice in development and would
 *     otherwise skip the first player's role on every dev run;
 *   - an in-flight flag makes a double-tap on Continue a no-op, which is a
 *     real risk on a device being handed between people.
 */
export function RevealScreen({ session }) {
  const toast = useToast();
  const { play } = useSound();

  const [screen, setScreen] = useState(null);
  const [error, setError] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);

  const startedRef = useRef(false);
  const inFlightRef = useRef(false);

  const advance = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    setError(null);

    try {
      const next = await fetchRoleReveal();
      setScreen(next);
      setRevealed(false);
      // Cue the handoff here rather than in an effect: this is the moment the
      // new screen arrives, and it is already inside a user gesture, which is
      // what browsers require before audio may start.
      if (next?.screenType === "PASS_DEVICE") play("handoff");
    } catch (caught) {
      setError(caught);
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  }, [play]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    advance();
  }, [advance]);

  /*
   * On the last player's reveal the server has already moved the game to
   * DISCUSSION_TIME. Their card still has to be shown, so the flow does not
   * follow the status here — it waits for this player to finish, then
   * re-reads state to hand over to the discussion screen.
   */
  const finish = async () => {
    setBusy(true);
    try {
      await session.refresh();
    } catch {
      toast.error("Couldn't start the discussion. Try again.");
      setBusy(false);
    }
  };

  if (error) {
    return (
      <Screen center width="reading" title="The reveal stalled">
        <EmptyState
          tone="error"
          icon="⚠"
          title="Couldn't load the next player"
          description="The round is still on the server. Try again, and it will pick up where it left off."
          actions={<Button onClick={advance}>Try again</Button>}
        />
      </Screen>
    );
  }

  if (!screen) {
    return (
      <Screen center width="narrow">
        <LoadingBlock label="Dealing roles…" />
      </Screen>
    );
  }

  const player = screen.playerDetails ?? {};
  const isHandoff = screen.screenType === "PASS_DEVICE";

  if (isHandoff) {
    return (
      <Screen
        center
        width="narrow"
        actions={
          <Button size="lg" onClick={advance} loading={busy} fullWidth pulse>
            I'm {player.playerName} — show me
          </Button>
        }
      >
        <div className={styles.handoff}>
          <Badge tone="neutral">Player {player.playerNumber}</Badge>
          <Avatar name={player.playerName ?? ""} size="xl" state="active" />
          <span className={styles.handoffName}>Pass to {player.playerName}</span>
          <span className={styles.handoffHint}>
            Everyone else, look away. Only {player.playerName} should see the next screen.
          </span>
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      center
      width="narrow"
      actions={
        screen.isLast ? (
          <Button size="lg" onClick={finish} loading={busy} fullWidth pulse>
            Everyone's in — start talking
          </Button>
        ) : (
          <Button size="lg" onClick={advance} loading={busy} fullWidth>
            Got it — pass it on
          </Button>
        )
      }
    >
      <div className={styles.stage}>
        <Badge tone="neutral">{player.playerName}</Badge>

        <RoleCard
          isSpy={Boolean(player.isSpy)}
          word={screen.wordName}
          categoryName={screen.categoryName}
          revealed={revealed}
          onRevealChange={(next) => {
            setRevealed(next);
            /*
             * One cue for both roles, deliberately.
             *
             * Playing something different for a spy would announce the role
             * to the whole room the instant the card opens — the one thing
             * this screen exists to prevent. Everyone hears the same flip.
             */
            if (next) play("flip");
          }}
        />

        <span className={styles.holdHint}>
          {revealed ? "Let go to hide it again." : "Press and hold the card."}
        </span>
      </div>
    </Screen>
  );
}

export default RevealScreen;
