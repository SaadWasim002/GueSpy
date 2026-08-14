import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import styles from "./Stepper.module.css";

/**
 * Numeric stepper with hard bounds.
 *
 * When a press would cross a bound the value holds and the control shakes,
 * then `onLimit(bound)` fires — the PRD wants the user told *why* nothing
 * happened, and the message differs per screen, so the copy is the caller's.
 */
export function Stepper({
  value,
  onChange,
  onLimit,
  min = 1,
  max = 10,
  step = 1,
  unit,
  label,
  className,
}) {
  const [bounced, setBounced] = useState(false);
  const bounceTimer = useRef(null);

  useEffect(() => () => clearTimeout(bounceTimer.current), []);

  const bounce = useCallback(
    (bound) => {
      setBounced(true);
      clearTimeout(bounceTimer.current);
      bounceTimer.current = setTimeout(() => setBounced(false), 400);
      onLimit?.(bound);
    },
    [onLimit],
  );

  const shift = (direction) => {
    const next = value + direction * step;
    if (next < min) return bounce("min");
    if (next > max) return bounce("max");
    return onChange?.(next);
  };

  return (
    <div
      className={cn(styles.stepper, bounced && styles.bounced, className)}
      role="group"
      aria-label={label}
    >
      {/*
        At a bound the buttons read as disabled but stay clickable: the PRD
        wants them dimmed *and* wants a message explaining the limit, and a
        truly disabled button can never deliver that message.
      */}
      <button
        type="button"
        className={cn(styles.button, value <= min && styles.atLimit)}
        onClick={() => shift(-1)}
        aria-disabled={value <= min}
        aria-label={`Decrease ${label ?? "value"}`}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M4 9h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className={styles.readout} aria-live="polite">
        <span className={styles.value}>{value}</span>
        {unit ? <span className={styles.unit}>{unit}</span> : null}
      </div>

      <button
        type="button"
        className={cn(styles.button, value >= max && styles.atLimit)}
        onClick={() => shift(1)}
        aria-disabled={value >= max}
        aria-label={`Increase ${label ?? "value"}`}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M9 4v10M4 9h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export default Stepper;
