import { forwardRef, useId, useState } from "react";
import { cn } from "../../lib/cn";
import styles from "./TextInput.module.css";

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M3 4.5 20.5 20M9.9 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 3.9M6.4 8.1A16.7 16.7 0 0 0 2.5 12S6 18.5 12 18.5c1 0 1.9-.2 2.7-.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Labelled text field with inline validation.
 *
 * `type="password"` gets a show/hide toggle automatically — the PRD asks for
 * one on every password field, so it belongs here rather than at each call site.
 */
export const TextInput = forwardRef(function TextInput(
  {
    label,
    hint,
    error,
    size = "md",
    type = "text",
    icon,
    centered = false,
    maxLength,
    value,
    className,
    id: idProp,
    disabled,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const id = idProp ?? reactId;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";
  const resolvedType = isPassword && revealed ? "text" : type;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn(styles.field, className)}>
      {label ? (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      ) : null}

      <div
        className={cn(
          styles.shell,
          styles[size],
          centered && styles.centered,
          error && styles.invalid,
          error && styles.shake,
          disabled && styles.disabled,
        )}
      >
        {icon ? <span className={styles.adornment}>{icon}</span> : null}

        <input
          ref={ref}
          id={id}
          type={resolvedType}
          className={styles.input}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />

        {isPassword ? (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Hide password" : "Show password"}
            tabIndex={disabled ? -1 : 0}
          >
            {revealed ? <EyeClosed /> : <EyeOpen />}
          </button>
        ) : null}
      </div>

      {error || hint || maxLength ? (
        <div className={styles.footer}>
          {error ? (
            <span id={`${id}-error`} className={styles.error} role="alert">
              {error}
            </span>
          ) : hint ? (
            <span id={`${id}-hint`} className={styles.hint}>
              {hint}
            </span>
          ) : null}

          {maxLength ? (
            <span className={styles.counter}>
              {String(value ?? "").length}/{maxLength}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

export default TextInput;
