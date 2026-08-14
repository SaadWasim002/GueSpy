import { useCallback, useEffect, useMemo, useState } from "react";
import { configureApi, setAuthToken } from "../../lib/api";
import { decodeToken, isTokenExpired } from "../../lib/jwt";
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from "../../lib/storage";
import { useToast } from "../../ui";
import { AuthContext } from "./authContext";
import { loginRequest, registerRequest } from "./authService";

/** Read a persisted session, discarding it if the token has already expired. */
function restoreSession() {
  const token = readStorage(STORAGE_KEYS.token);
  if (!token || isTokenExpired(token)) {
    removeStorage(STORAGE_KEYS.token);
    return { token: null, user: null };
  }
  return { token, user: decodeToken(token) };
}

/*
 * Restore at module load, before React renders anything.
 *
 * Doing this outside the component means the session is known synchronously
 * on the very first render: no "booting" state, and no frame where a
 * returning user with a valid token is bounced to /login. It also means the
 * API client has the token before any screen effect can fire a request —
 * child effects run before a parent's, so an effect-based handoff here would
 * be too late.
 */
const INITIAL_SESSION = restoreSession();
setAuthToken(INITIAL_SESSION.token);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [session, setSession] = useState(INITIAL_SESSION);

  const signOut = useCallback(() => {
    setAuthToken(null);
    removeStorage(STORAGE_KEYS.token);
    setSession({ token: null, user: null });
  }, []);

  const adoptToken = useCallback((token) => {
    if (!token) throw new Error("Authentication succeeded but returned no token.");
    // Token first: it must be live before any screen reacts to the state
    // change by fetching.
    setAuthToken(token);
    writeStorage(STORAGE_KEYS.token, token);
    setSession({ token, user: decodeToken(token) });
  }, []);

  // Hand the HTTP client its React-side callbacks.
  useEffect(() => {
    configureApi({
      onUnauthorized: (hadToken) => {
        // Only announce an expiry the user was in a position to notice. A 401
        // while already signed out is just an unauthenticated call.
        if (hadToken) {
          toast.error("Your session expired. Please log in again.", {
            dedupeKey: "session-expired",
          });
        }
        signOut();
      },
      notify: (error) => toast.error(error.message, { dedupeKey: `global:${error.status}` }),
    });
  }, [toast, signOut]);

  // A token is valid for an hour; sign out the moment it lapses rather than
  // letting the next request fail.
  useEffect(() => {
    const expiresAt = session.user?.expiresAt;
    if (!expiresAt) return undefined;

    const timer = setTimeout(
      () => {
        toast.info("Your session expired. Please log in again.", { dedupeKey: "session-expired" });
        signOut();
      },
      Math.max(0, expiresAt - Date.now()),
    );

    return () => clearTimeout(timer);
  }, [session.user?.expiresAt, signOut, toast]);

  const login = useCallback(
    async (credentials) => adoptToken(await loginRequest(credentials)),
    [adoptToken],
  );

  const register = useCallback(
    async (details) => adoptToken(await registerRequest(details)),
    [adoptToken],
  );

  const value = useMemo(
    () => ({
      user: session.user,
      isAuthenticated: Boolean(session.token),
      login,
      register,
      logout: signOut,
    }),
    [session, login, register, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
