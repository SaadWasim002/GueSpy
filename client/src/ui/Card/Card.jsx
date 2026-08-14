import { cn } from "../../lib/cn";
import styles from "./Card.module.css";

const PAD = { none: styles.padNone, sm: styles.padSm, md: styles.padMd, lg: styles.padLg };

/**
 * Generic surface. Pass `interactive` to make it a real <button> — used for
 * every "pick one of these" grid in the app (categories, groups, players),
 * which keeps those selections keyboard-accessible for free.
 */
export function Card({
  children,
  as,
  pad = "md",
  tone = "default",
  interactive = false,
  selected = false,
  accentEdge = false,
  className,
  ...rest
}) {
  const Tag = as ?? (interactive ? "button" : "div");

  return (
    <Tag
      className={cn(
        styles.card,
        PAD[pad],
        tone !== "default" && styles[tone],
        interactive && styles.interactive,
        selected && styles.selected,
        accentEdge && styles.accentEdge,
        className,
      )}
      type={Tag === "button" ? "button" : undefined}
      aria-pressed={interactive && Tag === "button" ? selected : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Card;
