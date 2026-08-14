import { cn } from "../../lib/cn";
import styles from "./Avatar.module.css";

/**
 * Map a name to a stable hue (0-360).
 *
 * The backend only ever gives us player names, so avatars are generated
 * rather than uploaded. Hashing the name means the same player keeps the same
 * colour for the whole game — and across rounds — which is what makes a
 * roster readable at a glance.
 */
function hueFromName(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

function initialsOf(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2);
  return words[0][0] + words[words.length - 1][0];
}

export function Avatar({
  name = "",
  size = "md",
  state,
  ringColor,
  badge,
  className,
  style,
  ...rest
}) {
  return (
    <span
      className={cn(
        styles.avatar,
        styles[size],
        (state === "active" || ringColor) && styles.ringed,
        state && styles[state],
        className,
      )}
      style={{ "--hue": hueFromName(name), "--ring-color": ringColor, ...style }}
      title={name || undefined}
      {...rest}
    >
      <span aria-hidden="true">{initialsOf(name)}</span>
      <span className="sr-only">{name}</span>
      {badge ? <span className={styles.badge}>{badge}</span> : null}
    </span>
  );
}

/** Overlapping row of avatars, truncated with a "+n" chip. */
export function AvatarStack({ names = [], max = 5, size = "sm", className }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;

  return (
    <div className={cn(styles.stack, className)}>
      {shown.map((name, i) => (
        <Avatar key={`${name}-${i}`} name={name} size={size} />
      ))}
      {extra > 0 ? (
        <span className={cn(styles.avatar, styles[size], styles.overflow)}>+{extra}</span>
      ) : null}
    </div>
  );
}

export default Avatar;
