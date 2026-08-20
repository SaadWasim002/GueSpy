import { api } from "../../lib/api";

/**
 * Writes to the server's configuration.
 *
 * Reading is `fetchConfigs` in `platform/config/configService.js` — the same
 * endpoint the whole app already loads on sign-in, so there is no second
 * reader here.
 *
 * All three are admin-only server-side (`@PreAuthorize("hasRole('ADMIN')")`),
 * so a 403 means the caller is not an admin rather than that something went
 * wrong.
 */

/**
 * PUT /api/v1/configs — change an existing key's value. 404 if the key does
 * not exist; use `createConfig` for a new one.
 *
 * The server writes the row and calls `refresh()` itself, so the game engine
 * picks the change up immediately — no separate cache refresh is needed
 * after this.
 */
export async function updateConfig(key, value) {
  await api.put("/api/v1/configs", { key, value });
}

/** POST /api/v1/configs — add a key. 409 if it already exists. Also refreshes. */
export async function createConfig(key, value) {
  await api.post("/api/v1/configs", { key, value });
}

/**
 * GET /api/v1/configs/refresh — reload the engine's in-memory cache.
 *
 * A GET that mutates, which is the backend's shape rather than a choice
 * here. Only needed when a row has been changed *outside* the API — editing
 * the database directly leaves the API reporting the new value while the
 * engine keeps serving the old one, indefinitely. Changes made through this
 * screen refresh themselves.
 */
export async function refreshConfigCache() {
  await api.get("/api/v1/configs/refresh");
}
