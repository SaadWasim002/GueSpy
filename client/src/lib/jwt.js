import { jwtDecode } from "jwt-decode";

/**
 * Read the identity the backend put in the token.
 *
 * The server signs `sub` (username), `userId` and `role` and expires it after
 * an hour. This is for rendering decisions only — the backend re-derives both
 * userId and role from the token on every request, so nothing here is trusted
 * for authorisation.
 *
 * @returns {{ userId: number|null, username: string|null, role: string|null, expiresAt: number|null }|null}
 */
export function decodeToken(token) {
  if (!token) return null;

  try {
    const claims = jwtDecode(token);
    return {
      userId: claims.userId ?? null,
      username: claims.sub ?? null,
      role: claims.role ?? null,
      // `exp` is in seconds; everything else in the app works in millis.
      expiresAt: claims.exp ? claims.exp * 1000 : null,
    };
  } catch {
    return null;
  }
}

/**
 * Whether a token is past its expiry.
 *
 * `skewMs` expires it slightly early so a request isn't fired with a token
 * that dies in flight.
 */
export function isTokenExpired(token, skewMs = 5000) {
  const claims = decodeToken(token);
  if (!claims?.expiresAt) return true;
  return Date.now() + skewMs >= claims.expiresAt;
}
