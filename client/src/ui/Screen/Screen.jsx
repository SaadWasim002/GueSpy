import { cn } from "../../lib/cn";
import styles from "./Screen.module.css";

/**
 * The frame every screen in the app sits in.
 *
 * Content is split across a fold. `children` and `actions` are sized to
 * exactly one viewport, so on any device the essential content and its
 * buttons are reachable without scrolling; `secondary` holds detail worth
 * reading but never worth blocking the primary action for, and flows below.
 *
 * The entrance animation lives here rather than in each screen, so navigation
 * feels like one continuous flow across every game. It is deliberately a CSS
 * animation rather than a JS one: a JS entrance has to render the screen at
 * opacity 0 and rely on a frame loop to reveal it, and this game is passed
 * between people on one device — tabs get backgrounded mid-transition all the
 * time, which starves requestAnimationFrame. The CSS version's resting state
 * is fully visible, so no failure to animate can ever strand a screen blank.
 *
 * @param width      narrow | reading | wide
 * @param center     vertically centre and centre-align the fold
 * @param secondary  content rendered below the fold
 */
export function Screen({
  eyebrow,
  title,
  subtitle,
  children,
  actions,
  secondary,
  width = "wide",
  center = false,
  className,
  ...rest
}) {
  return (
    <main
      className={cn(styles.screen, styles[width], center && styles.centered, className)}
      {...rest}
    >
      <div className={styles.fold}>
        {eyebrow || title || subtitle ? (
          <header className={cn(styles.header, center && styles.headerCentered)}>
            {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
            {title ? <h1 className={styles.title}>{title}</h1> : null}
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </header>
        ) : null}

        {children ? <div className={styles.body}>{children}</div> : null}

        {actions ? (
          <div className={cn(styles.actions, center && styles.actionsCentered)}>{actions}</div>
        ) : null}
      </div>

      {secondary ? <div className={styles.secondary}>{secondary}</div> : null}
    </main>
  );
}

export default Screen;
