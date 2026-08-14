import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/cn";
import { IconButton } from "../IconButton/IconButton";
import styles from "./Modal.module.css";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Portalled dialog with a backdrop.
 *
 * Handles the things every dialog needs and nobody remembers to add: escape
 * to close, background scroll lock, focus moved in on open and returned to
 * the trigger on close, and Tab wrapped inside the panel.
 *
 * On narrow screens it becomes a bottom sheet (see the module CSS).
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
  className,
}) {
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  // Lock background scroll while open.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Move focus into the panel, and hand it back to the trigger on close.
  useEffect(() => {
    if (!open) return undefined;
    restoreFocusRef.current = document.activeElement;

    const id = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    });

    return () => {
      cancelAnimationFrame(id);
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  // Escape to close, Tab trapped within the panel.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape" && dismissible) {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, dismissible, onClose]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(event) => {
            // Only a press that both starts and ends on the backdrop closes,
            // so a drag that began inside the panel does not dismiss it.
            if (dismissible && event.target === event.currentTarget) onClose?.();
          }}
        >
          <motion.div
            ref={panelRef}
            className={cn(styles.panel, styles[size], className)}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            {title || dismissible ? (
              <div className={styles.header}>
                <div className={styles.headings}>
                  {title ? (
                    <h2 className={styles.title} id={titleId}>
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p className={styles.description} id={descId}>
                      {description}
                    </p>
                  ) : null}
                </div>

                {dismissible ? (
                  <IconButton label="Close" size="sm" onClick={onClose}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </IconButton>
                ) : null}
              </div>
            ) : null}

            <div className={cn(styles.body, !title && !dismissible && styles.bodyOnly)}>
              {children}
            </div>

            {footer ? <div className={styles.footer}>{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export default Modal;
