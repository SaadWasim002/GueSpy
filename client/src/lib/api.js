import axios from "axios";
import { API_BASE_URL, API_TIMEOUT_MS } from "../config/env";
import { toApiError } from "./apiError";

/**
 * The single HTTP client. Every backend call in the app goes through here.
 *
 * React-side concerns (which token is current, where to send an expired
 * session, how to surface a server fault) are injected via `configureApi`
 * rather than imported. Interceptors run outside the React tree and must not
 * reach into it — this keeps the module free of provider imports and avoids
 * a cycle, since the auth provider is itself built on this client.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

const handlers = {
  getToken: () => null,
  onUnauthorized: () => {},
  notify: () => {},
};

/**
 * Wire the client to the running app. Called once, from AuthProvider.
 *
 * @param {object} next
 * @param {() => string|null} next.getToken       current bearer token
 * @param {() => void}        next.onUnauthorized session died — sign out
 * @param {(e: ApiError) => void} next.notify     surface a global failure
 */
export function configureApi(next) {
  Object.assign(handlers, next);
}

api.interceptors.request.use((config) => {
  const token = handlers.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Deliberately no X-User-Id header: the backend derives the user from the
  // token itself, and sending one would imply the client can choose it.
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A cancelled request is a normal part of screens that unmount mid-flight
    // (polling, fast navigation). It is not a failure worth reporting.
    if (axios.isCancel(error)) return Promise.reject(error);

    const apiError = toApiError(error);

    if (apiError.status === 401) {
      // Expired or invalid token. Clearing the session sends the user to
      // login via the router; the screen that made the call still sees the
      // rejection and can stop its own work.
      handlers.onUnauthorized();
    } else if (apiError.isServerError || apiError.isNetworkError) {
      // Faults the user can do nothing about are announced globally, so no
      // screen has to remember to handle them. Everything else (400/404/409)
      // is contextual and left to the caller.
      handlers.notify(apiError);
    }

    return Promise.reject(apiError);
  },
);

/**
 * Unwrap the response envelope.
 *
 * The backend nests payloads under `data`, so callers would otherwise all
 * write `response.data.data`. Some endpoints (vote, select, reset) return a
 * body with no `data` at all, hence the null.
 */
export function unwrap(response) {
  return response?.data?.data ?? null;
}

/** The whole envelope, for the few callers that need `message` or `gameStatus`. */
export function envelope(response) {
  return response?.data ?? null;
}
