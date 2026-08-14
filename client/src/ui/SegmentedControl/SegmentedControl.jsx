import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/cn";
import styles from "./SegmentedControl.module.css";

/**
 * Pill switch for two to four mutually exclusive choices.
 *
 * Built for things like the play-mode switch (pass & play vs online), where
 * an option can be present but not yet selectable — pass `disabled` on the
 * option and it stays visible, dimmed, and announced.
 *
 * @param options  [{ value, label, icon?, disabled? }]
 */
export function SegmentedControl({ options, value, onChange, fullWidth = false, label, className }) {
  const groupId = useId();

  return (
    <div
      className={cn(styles.group, fullWidth && styles.fullWidth, className)}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={option.disabled}
            className={cn(styles.option, active && styles.active)}
            onClick={() => !option.disabled && onChange?.(option.value)}
          >
            {active ? (
              <motion.span
                layoutId={`segmented-thumb-${groupId}`}
                className={styles.thumb}
                transition={{ type: "spring", stiffness: 520, damping: 40 }}
              />
            ) : null}
            {option.icon ? <span aria-hidden="true">{option.icon}</span> : null}
            <span className={styles.label}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
