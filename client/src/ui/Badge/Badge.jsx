import { cn } from "../../lib/cn";
import styles from "./Badge.module.css";

/**
 * Small status pill.
 *
 * @param tone  neutral | accent | success | danger | warning | info
 * @param dot   prefix with a pulsing dot, for live/in-progress states
 */
export function Badge({ children, tone = "neutral", size = "md", dot = false, className, ...rest }) {
  return (
    <span
      className={cn(styles.badge, styles[tone], size === "lg" && styles.lg, dot && styles.dot, className)}
      {...rest}
    >
      {children}
    </span>
  );
}

export default Badge;
