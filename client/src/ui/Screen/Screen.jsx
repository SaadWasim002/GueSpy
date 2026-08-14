import { motion } from "motion/react";
import { cn } from "../../lib/cn";
import styles from "./Screen.module.css";

/**
 * The frame every screen in the app sits in: optional eyebrow/title/subtitle,
 * a body, and a footer action row that sticks to the bottom on phones.
 *
 * Keeping the entrance animation here (rather than per screen) is what makes
 * navigation feel like one continuous flow across games.
 *
 * @param width   narrow | reading | wide
 * @param center  vertically centre and centre-align — for handoffs and results
 */
export function Screen({
  eyebrow,
  title,
  subtitle,
  children,
  actions,
  width = "wide",
  center = false,
  stickyActions = true,
  className,
  ...rest
}) {
  return (
    <motion.main
      className={cn(styles.screen, styles[width], center && styles.centered, className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {eyebrow || title || subtitle ? (
        <header className={cn(styles.header, center && styles.headerCentered)}>
          {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
          {title ? <h1 className={styles.title}>{title}</h1> : null}
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>
      ) : null}

      {children ? <div className={styles.body}>{children}</div> : null}

      {actions ? (
        <div
          className={cn(
            styles.actions,
            center && styles.actionsCentered,
            stickyActions && styles.sticky,
          )}
        >
          {actions}
        </div>
      ) : null}
    </motion.main>
  );
}

export default Screen;
