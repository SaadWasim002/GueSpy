import { Link, useNavigate } from "react-router-dom";
import { Avatar, IconButton } from "../ui";
import { useAuth } from "../platform/auth/authContext";
import { useSound } from "../platform/sound/soundContext";
import styles from "./AppHeader.module.css";

const SoundOnIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M4 7.5h2.5L10 4.5v11L6.5 12.5H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M13 7.2a4 4 0 0 1 0 5.6M15.4 5a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SoundOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M4 7.5h2.5L10 4.5v11L6.5 12.5H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M13.2 7.8l4 4.4M17.2 7.8l-4 4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M12.5 6V4.5A1.5 1.5 0 0 0 11 3H5.5A1.5 1.5 0 0 0 4 4.5v11A1.5 1.5 0 0 0 5.5 17H11a1.5 1.5 0 0 0 1.5-1.5V14"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M8.5 10h8m0 0-2.5-2.5M16.5 10 14 12.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AdminIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M10 2.5 4 5v4.3c0 3.4 2.4 6.5 6 8.2 3.6-1.7 6-4.8 6-8.2V5z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="m7.6 10 1.7 1.7 3.3-3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Persistent top bar. Deliberately thin — during a game the screen itself is
 * the interface, and chrome competing with it would only get in the way.
 */
export function AppHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const { muted, toggleMuted } = useSound();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          ◕
        </span>
        <span>
          Gue<span className={styles.brandAccent}>Spy</span>
        </span>
      </Link>

      <div className={styles.spacer} />

      {/* Available signed out too — the sign-in screen has a playable
          warm-up, and it makes noise. */}
      <IconButton
        label={muted ? "Turn sound on" : "Turn sound off"}
        size="sm"
        onClick={toggleMuted}
        aria-pressed={!muted}
      >
        {muted ? <SoundOffIcon /> : <SoundOnIcon />}
      </IconButton>

      {/* Only admins are shown the door. The route guards it too, and the
          backend guards every endpoint behind it — this just keeps a link
          nobody else can use out of everyone else's way. */}
      {isAuthenticated && user?.role === "ADMIN" ? (
        <IconButton label="Admin" size="sm" as={Link} to="/admin">
          <AdminIcon />
        </IconButton>
      ) : null}

      {isAuthenticated ? (
        <div className={styles.identity}>
          <span className={styles.username}>{user?.username}</span>
          <Avatar name={user?.username ?? ""} size="sm" />
          <IconButton label="Log out" size="sm" onClick={signOut}>
            <LogoutIcon />
          </IconButton>
        </div>
      ) : null}
    </header>
  );
}

export default AppHeader;
