import { api, unwrap } from "../../lib/api";

/**
 * GET /api/v1/configs → the full config list, as `data.configs`.
 *
 * Requires a bearer token: the backend permits only `/api/v1/auth/**` anonymously,
 * so this can be called at the earliest after sign-in.
 */
export async function fetchConfigs() {
  const response = await api.get("/api/v1/configs");
  return unwrap(response)?.configs ?? [];
}
