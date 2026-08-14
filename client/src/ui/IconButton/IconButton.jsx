import { cn } from "../../lib/cn";
import styles from "./IconButton.module.css";

/**
 * Circular icon-only button. `label` is required — it becomes the accessible
 * name and the tooltip, since there is no visible text to fall back on.
 */
export function IconButton({
  children,
  label,
  variant = "ghost",
  size = "md",
  className,
  as: Tag = "button",
  ...rest
}) {
  return (
    <Tag
      type={Tag === "button" ? "button" : undefined}
      className={cn(styles.iconButton, styles[variant], styles[size], className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default IconButton;
