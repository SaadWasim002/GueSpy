import { Fragment } from "react";
import { cn } from "../../lib/cn";
import styles from "./StepTrail.module.css";

const Check = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="m2.5 6.3 2.4 2.4L9.6 3.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Horizontal progress trail for a multi-step flow.
 *
 * A game's setup is a sequence of server-driven states, and without this the
 * player has no idea how many screens stand between them and playing.
 *
 * @param steps    [{ id, label }]
 * @param current  id of the active step
 */
export function StepTrail({ steps, current, className }) {
  const currentIndex = steps.findIndex((step) => step.id === current);

  return (
    <ol className={cn(styles.trail, className)} aria-label="Setup progress">
      {steps.map((step, index) => {
        const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";

        return (
          <Fragment key={step.id}>
            <li
              className={cn(styles.step, styles[state])}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className={styles.dot}>{state === "done" ? <Check /> : index + 1}</span>
              <span className={styles.label}>{step.label}</span>
            </li>

            {index < steps.length - 1 ? (
              <span
                className={cn(styles.connector, index < currentIndex && styles.filled)}
                aria-hidden="true"
              >
                <span className={styles.connectorFill} />
              </span>
            ) : null}
          </Fragment>
        );
      })}
    </ol>
  );
}

export default StepTrail;
