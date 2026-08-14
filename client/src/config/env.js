/**
 * Runtime configuration, read from Vite env vars with development defaults.
 *
 * Everything here is baked in at build time, so it must never hold secrets —
 * only the location of the backend and dev-only switches.
 */

/** Backend origin. Override with VITE_API_BASE_URL when not on localhost. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/** How long a request may hang before we treat it as a network failure. */
export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000);

/** The component gallery is mounted only in dev builds. */
export const IS_DEV = import.meta.env.DEV;
