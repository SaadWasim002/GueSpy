/**
 * Join class names, dropping anything falsy.
 *
 * Written for the CSS-Modules style used across the UI kit, where most
 * arguments are `styles.x && condition` expressions:
 *
 *   cn(styles.button, styles[variant], isActive && styles.active, className)
 */
export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default cn;
