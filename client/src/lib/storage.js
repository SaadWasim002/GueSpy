/**
 * Namespaced localStorage access.
 *
 * Wrapped rather than used directly because storage throws in private-mode
 * Safari and when a browser blocks site data — a game should degrade to
 * "you'll have to log in again next time", never crash on boot.
 */

const PREFIX = "guespy.";

export function readStorage(key) {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Storage unavailable — the session simply won't survive a reload.
  }
}

export function removeStorage(key) {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing to do; the value was never persisted.
  }
}

export const STORAGE_KEYS = {
  token: "token",
};
