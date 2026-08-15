import { Badge, Screen } from "../../../ui";
import { SpotTheSpy } from "./SpotTheSpy";
import styles from "./AuthLayout.module.css";

const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className={styles.formErrorIcon} aria-hidden="true">
    <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.6" />
    <path d="M10 5.8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="10" cy="13.7" r="1" fill="currentColor" />
  </svg>
);

/**
 * Shared frame for the login and register screens: the pitch on one side, the
 * form on the other.
 *
 * @param formError  form-level failure (bad credentials, duplicate account),
 *                   as opposed to the per-field errors TextInput renders
 */
export function AuthLayout({ title, subtitle, formError, onSubmit, children, footer, busy }) {
  return (
    <Screen center width="wide">
      <div className={styles.layout}>
        <section className={styles.pitch}>
          <h2 className={styles.headline}>
            Everyone gets the word.
            <br />
            <span className={styles.headlineAccent}>Except one of you.</span>
          </h2>

          <p className={styles.blurb}>
            Pass one phone around the room, find the impostor before they blend in — and try not to
            give yourself away.
          </p>

          <div className={styles.points}>
            <Badge tone="neutral">One device</Badge>
            <Badge tone="neutral">3+ players</Badge>
            <Badge tone="neutral">5 minutes a round</Badge>
          </div>

          <SpotTheSpy />
        </section>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className={styles.heading}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>

          {formError ? (
            <div className={styles.formError} role="alert">
              <WarningIcon />
              <span>{formError}</span>
            </div>
          ) : null}

          <fieldset className={styles.fields} disabled={busy}>
            {children}
          </fieldset>

          {footer}
        </form>
      </div>
    </Screen>
  );
}

export default AuthLayout;
