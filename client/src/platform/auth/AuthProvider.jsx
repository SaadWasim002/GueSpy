import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { configureApi } from "../../lib/api";
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

export function AuthProvider({ children }) {
  const toast = useToast();

  const [session, setSession] = useState(() => restoreSession());
  // `isBooting` covers the first synchronous restore. It exists so protected
  // routes don't bounce a returning user to /login for one frame before the
  // stored token is read.
  const [isBooting, setIsBooting] = useState(true);

  // The interceptor closure is installed once but must always see the
  // *current* token, so it reads a ref rather than captured state.
  const tokenRef = useRef(session.token);
  tokenRef.current = session.token;

  const signOut = useCallback(() => {
    removeStorage(STORAGE_KEYS.token);
    setSession({ token: null, user: null });
  }, []);

  const adoptToken = useCallback((token) => {
    if (!token) throw new Error("Authentication succeeded but returned no token.");
    writeStorage(STORAGE_KEYS.token, token);
    setSession({ token, user: decodeToken(token) });
  }, []);

  // Hand the HTTP client its React-side dependencies. Effects run child-first,
  // so this is set before any screen can fire a request.
  useEffect(() => {
    configureApi({
      getToken: () => tokenRef.current,
      onUnauthorized: () => {
        // Only announce an expiry the user was in a position to notice. A 401
        // while already signed out is just an unauthenticated call.
        if (tokenRef.current) {
          toast.error("Your session expired. Please log in again.", { dedupeKey: "session-expired" });
        }
        signOut();
      },
      notify: (error) => toast.error(error.message, { dedupeKey: `global:${error.status}` }),
    });
    setIsBooting(false);
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
      isBooting,
      login,
      register,
      logout: signOut,
    }),
    [session, isBooting, login, register, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
