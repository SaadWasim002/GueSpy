import { cn } from "../../lib/cn";
import { Spinner } from "../Spinner/Spinner";
import styles from "./Button.module.css";

/**
 * The app's one button.
 *
 * @param variant  primary | secondary | ghost | danger | dangerGhost
 * @param size     sm | md | lg
 * @param loading  swaps the label for a spinner without changing width
 * @param pulse    slow glow, for the single action a screen is waiting on
 * @param as       render as another element/component (e.g. react-router Link)
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  pulse = false,
  iconLeft,
  iconRight,
  className,
  as: Tag = "button",
  type,
  ...rest
}) {
  const isNativeButton = Tag === "button";

  return (
    <Tag
      // A custom `as` (e.g. Link) has no implicit type and must not receive one.
      type={isNativeButton ? (type ?? "button") : undefined}
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        pulse && styles.pulse,
        loading && styles.loading,
        className,
      )}
      disabled={isNativeButton ? disabled || loading : undefined}
      aria-disabled={!isNativeButton && (disabled || loading) ? true : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {iconLeft ? (
        <span className={styles.affix} aria-hidden="true">
          {iconLeft}
        </span>
      ) : null}

      <span className={styles.label}>{children}</span>

      {iconRight ? (
        <span className={styles.affix} aria-hidden="true">
          {iconRight}
        </span>
      ) : null}

      {loading ? (
        <span className={styles.spinner}>
          <Spinner size={size === "lg" ? "sm" : "xs"} label="Working" />
        </span>
      ) : null}
    </Tag>
  );
}

export default Button;
