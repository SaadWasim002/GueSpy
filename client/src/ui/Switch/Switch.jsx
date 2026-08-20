import { useId } from "react";
import { cn } from "../../lib/cn";
import styles from "./Switch.module.css";

/**
 * On/off control for a single setting.
 *
 * Distinct from `SegmentedControl`, which is a radio group for two to four
 * labelled *choices*. A switch says "this thing is on"; a segmented control
 * says "pick one of these". Rendering a boolean as two competing options
 * makes the current state harder to read at a glance, not easier.
 *
 * Built on a real checkbox rather than a styled div, so it is reachable by
 * keyboard, announced with its state, and toggled by space — none of which
 * has to be reimplemented here.
 *
 * @param label       visible label, also the accessible name
 * @param description optional line under the label
 */
export function Switch({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  className,
  ...rest
}) {
  const id = useId();
  const describedBy = description ? `${id}-desc` : undefined;

  return (
    <div className={cn(styles.row, disabled && styles.disabled, className)}>
      <div className={styles.text}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {description ? (
          <span className={styles.description} id={describedBy}>
            {description}
          </span>
        ) : null}
      </div>

      <input
        id={id}
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={(event) => onChange?.(event.target.checked)}
        {...rest}
      />

      {/*
        The track is painted by the label, not by the input, so the whole
        control is one hit target: clicking the track, the thumb or the text
        all toggle it. `aria-hidden` because the input above already carries
        the name and the state.
      */}
      <label className={styles.track} htmlFor={id} aria-hidden="true">
        <span className={styles.thumb} />
      </label>
    </div>
  );
}

export default Switch;
