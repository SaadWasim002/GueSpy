import { cn } from "../../lib/cn";
import styles from "./Skeleton.module.css";

/**
 * Shimmering placeholder. Prefer this over a spinner wherever the final
 * layout is known — it keeps the screen from jumping when data lands.
 *
 * @param shape  text | rect | circle | card
 */
export function Skeleton({ shape = "rect", width, height, className, style, ...rest }) {
  return (
    <span
      className={cn(styles.skeleton, styles[shape], className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
}

/** A few stacked text lines, the last one deliberately short. */
export function SkeletonText({ lines = 3, className }) {
  return (
    <span className={cn(styles.group, className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} shape="text" />
      ))}
    </span>
  );
}

export default Skeleton;
