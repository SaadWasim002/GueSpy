import { cn } from "../../lib/cn";
import styles from "./EmptyState.module.css";

/**
 * "Nothing here yet" / "that didn't work" panel.
 *
 * The PRD spells out an empty message for most list endpoints (no categories,
 * no groups); this gives all of them one shape, plus a slot for the recovery
 * action so a dead end always offers a way forward.
 */
export function EmptyState({ icon, title, description, actions, tone = "default", className }) {
  return (
    <div className={cn(styles.empty, tone === "error" && styles.error, className)}>
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}

      {title ? <p className={styles.title}>{title}</p> : null}
      {description ? <p className={styles.description}>{description}</p> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}

export default EmptyState;
