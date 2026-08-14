import { cn } from "../../lib/cn";
import styles from "./ProgressRing.module.css";

/**
 * Circular progress / countdown ring.
 *
 * @param progress  0 to 1 — the fraction still remaining
 * @param color     overrides the accent stroke (e.g. red as time runs out)
 * @param urgent    pulses the indicator
 * @param children  rendered in the middle; use <RingValue> for the standard look
 */
export function ProgressRing({
  progress = 1,
  size = 200,
  thickness = 10,
  color,
  urgent = false,
  children,
  className,
  label,
  ...rest
}) {
  const clamped = Math.min(1, Math.max(0, progress));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={cn(styles.ring, urgent && styles.urgent, className)}
      style={{ "--ring-color": color, width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      aria-label={label}
      {...rest}
    >
      <svg className={styles.svg} width={size} height={size} aria-hidden="true">
        <circle
          className={styles.track}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
        />
        <circle
          className={styles.indicator}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
        />
      </svg>

      {children ? <div className={styles.center}>{children}</div> : null}
    </div>
  );
}

/** Standard ring centre: a big number with a small caption under it. */
export function RingValue({ value, caption }) {
  return (
    <>
      <span className={styles.value}>{value}</span>
      {caption ? <span className={styles.caption}>{caption}</span> : null}
    </>
  );
}

export default ProgressRing;
