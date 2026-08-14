import { cn } from "../../lib/cn";
import styles from "./Screen.module.css";

/**
 * The frame every screen in the app sits in: optional eyebrow/title/subtitle,
 * a body, and a footer action row that sticks to the bottom on phones.
 *
 * The entrance animation lives here rather than in each screen, so navigation
 * feels like one continuous flow across every game. It is deliberately a CSS
 * animation rather than a JS one: a JS entrance has to render the screen at
 * opacity 0 and rely on a frame loop to reveal it, and this game is passed
 * between people on one device — tabs get backgrounded mid-transition all the
 * time, which starves requestAnimationFrame. The CSS version's resting state
 * is fully visible, so no failure to animate can ever strand a screen blank.
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
    <main
      className={cn(styles.screen, styles[width], center && styles.centered, className)}
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
    </main>
  );
}

export default Screen;
