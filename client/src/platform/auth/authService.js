import { api, unwrap } from "../../lib/api";

/**
 * Auth endpoints.
 *
 * Both return only a JWT — there is no user object on the wire, so identity
 * is read back out of the token (see lib/jwt.js).
 */

/** POST /auth/register → token. 409 if the email is taken. */
export async function registerRequest({ username, email, password }) {
  const response = await api.post("/auth/register", { username, email, password });
  return unwrap(response)?.token ?? null;
}

/** POST /auth/login → token. 401 wrong password, 404 unknown email. */
export async function loginRequest({ email, password }) {
  const response = await api.post("/auth/login", { email, password });
  return unwrap(response)?.token ?? null;
}

/*
 * There is no logout endpoint. Auth is stateless JWT, so signing out means
 * discarding the token client-side; it expires on its own after an hour.
 */
