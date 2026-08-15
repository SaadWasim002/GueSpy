import { useState } from "react";
import { Badge, Button, Screen, StepTrail, Stepper, useToast } from "../../../ui";
import { cn } from "../../../lib/cn";
import { useAppConfig } from "../../../platform/config/configContext";
import { setGameOption } from "../gameEngineService";
import { SETUP_STEPS } from "../setupSteps";
import styles from "./GameOptionScreen.module.css";

/**
 * The engine only supports one or two spies, so the UI never offers more.
 *
 * This is a hard cap rather than a preference, for two reasons. The seeded
 * `max_spy_allowed` config currently says 3, which contradicts the game
 * logic. And the server puts no upper bound on `number_of_spy` at all: it
 * picks distinct spies with `while (spies.size() < n)` over the player
 * numbers, so asking for more spies than there are players is unsatisfiable
 * and the request never returns.
 *
 * Two spies is always safe here because a group cannot be created with fewer
 * than `min_player_allowed_in_group` (3) members, so the count is never
 * reached. The real fix belongs on the server — a client cannot protect an
 * endpoint anyone can call directly.
 */
const HARD_SPY_CAP = 2;

const SPY_MODES = [
  {
    count: 1,
    title: "One spy",
    body: "The classic round. One person is bluffing and everyone else is telling the truth.",
  },
  {
    count: 2,
    title: "Two spies",
    body: "Better with a bigger group. The spies don't know each other, but they can accidentally cover for one another.",
  },
];

export function GameOptionScreen({ session }) {
  const toast = useToast();
  const { settings } = useAppConfig();

  const maxSpies = Math.min(settings.maxSpies ?? HARD_SPY_CAP, HARD_SPY_CAP);
  const minSpies = Math.max(1, Math.min(settings.minSpies ?? 1, maxSpies));

  const [spies, setSpies] = useState(minSpies);
  const [submitting, setSubmitting] = useState(false);

  const start = async () => {
    setSubmitting(true);
    try {
      await setGameOption(spies);
      await session.refresh();
    } catch (error) {
      toast.error(
        error?.status === 400
          ? `Pick between ${minSpies} and ${maxSpies} spies.`
          : "Couldn't start the round. Try again.",
      );
      setSubmitting(false);
    }
    // On success the session moves to the reveal screen and this unmounts,
    // so the submitting flag is deliberately left set.
  };

  return (
    <Screen
      width="reading"
      eyebrow="Set up"
      title="How many spies?"
      subtitle="Everyone else gets the secret word. The spies have to work out what it is without giving themselves away."
      actions={
        <Button size="lg" onClick={start} loading={submitting} iconRight="→" pulse>
          Deal the round
        </Button>
      }
    >
      <StepTrail steps={SETUP_STEPS} current="GAME_OPTION_SELECTION" />

      <div className={styles.picker}>
        <span className={styles.pickerLabel}>Spies in the game</span>

        <div className={styles.lineup} aria-hidden="true">
          {Array.from({ length: spies }, (_, i) => (
            <span key={i} className={styles.figure}>
              🕵
            </span>
          ))}
        </div>

        <Stepper
          value={spies}
          onChange={setSpies}
          min={minSpies}
          max={maxSpies}
          unit={spies === 1 ? "spy" : "spies"}
          label="number of spies"
          onLimit={(bound) =>
            toast.warning(
              bound === "max"
                ? `This game supports at most ${maxSpies} spies.`
                : `You need at least ${minSpies} spy.`,
            )
          }
        />
      </div>

      <div className={styles.explainer}>
        {SPY_MODES.filter((mode) => mode.count <= maxSpies).map((mode) => (
          <div
            key={mode.count}
            className={cn(styles.option, spies === mode.count && styles.optionActive)}
          >
            <span className={styles.optionTitle}>
              {mode.title}
              {spies === mode.count ? <Badge tone="accent">Selected</Badge> : null}
            </span>
            <span className={styles.optionBody}>{mode.body}</span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

export default GameOptionScreen;
