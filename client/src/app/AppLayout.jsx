import { AppHeader } from "./AppHeader";
import styles from "./AppLayout.module.css";

/**
 * Frame shared by every route: header on top, routed content below.
 *
 * The header lives outside the page transition on purpose — it is the one
 * piece of chrome that should stay put while screens come and go.
 */
export function AppLayout({ children }) {
  return (
    <div className={styles.shell}>
      <AppHeader />
      <div className={styles.content}>{children}</div>
    </div>
  );
}

export default AppLayout;
