/**
 * Normalised failure from any backend call.
 *
 * Every backend response — success or error — uses the same envelope:
 *   { status: "404 NOT_FOUND", message: "<human readable>", data?: ... }
 *
 * Note what is *not* there: a machine-readable error code. The server's
 * `ResponseEnum` names (NO_CATEGORY_FOUND, INVALID_GAME_STATUS, …) never
 * reach the wire — only the HTTP status and a prose message do. So screens
 * must branch on `status` plus the endpoint they called, and treat `message`
 * as display text rather than something to match on. If the backend later
 * adds a `code` field, this is the one place that needs to learn about it.
 */
export class ApiError extends Error {
  constructor({ status, message, data = null, isNetworkError = false, cause }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
    this.cause = cause;
  }

  /** True for the "server is up but refused this" family. */
  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError() {
    return this.status >= 500;
  }
}

/** Fallback copy per status, used when the server sends no message. */
const FALLBACK_MESSAGES = {
  400: "Something about that request wasn't valid.",
  401: "Your session has expired. Please log in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "That conflicts with something that already exists.",
  500: "Internal Server Error",
};

export const NETWORK_ERROR_MESSAGE = "No internet connection. Check your network and try again.";

/**
 * Turn an axios failure into an ApiError.
 *
 * A request that never reached the server (offline, DNS, timeout, CORS) has
 * no response at all — that becomes `isNetworkError` with status 0, so
 * callers can tell "the server said no" apart from "we never got there".
 */
export function toApiError(error) {
  if (error?.response) {
    const { status, data } = error.response;
    return new ApiError({
      status,
      message: data?.message || FALLBACK_MESSAGES[status] || "Something went wrong.",
      data: data?.data ?? null,
      cause: error,
    });
  }

  return new ApiError({
    status: 0,
    message: NETWORK_ERROR_MESSAGE,
    isNetworkError: true,
    cause: error,
  });
}

/** `catch (err) { if (isStatus(err, 404)) … }` */
export function isStatus(error, ...statuses) {
  return error instanceof ApiError && statuses.includes(error.status);
}
