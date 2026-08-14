import { cn } from "../../lib/cn";
import styles from "./Spinner.module.css";

/**
 * Indeterminate loading ring. Inherits `currentColor`, so it picks up the
 * colour of whatever it is placed inside (a button, a link, a panel).
 */
export function Spinner({ size = "md", className, label = "Loading", ...rest }) {
  return (
    <span
      className={cn(styles.spinner, styles[size], className)}
      role="status"
      aria-label={label}
      {...rest}
    />
  );
}

/** Spinner centred in its own block, for a panel waiting on data. */
export function LoadingBlock({ label = "Loading…", size = "md" }) {
  return (
    <div className={styles.block}>
      <Spinner size={size} label={label} />
      {label ? <span className={styles.blockLabel}>{label}</span> : null}
    </div>
  );
}

export default Spinner;
