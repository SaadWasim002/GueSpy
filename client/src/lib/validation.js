/**
 * Client-side form validation.
 *
 * This exists for feedback speed, not for safety — the backend validates
 * everything again. Rules are kept deliberately loose so the client never
 * rejects something the server would have accepted; being stricter here just
 * blocks real users for no gain.
 */

/*
 * Intentionally permissive: "something@something.something". Elaborate email
 * regexes reject valid addresses more often than they catch typos, and the
 * server applies @Email anyway.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 6;
export const MIN_USERNAME_LENGTH = 2;
export const MAX_USERNAME_LENGTH = 32;

export function validateEmail(value) {
  const email = value?.trim() ?? "";
  if (!email) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(email)) return "That doesn't look like an email address.";
  return null;
}

export function validatePassword(value) {
  if (!value) return "Enter a password.";
  // The backend only requires non-blank; this is a nudge, not a gate.
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function validateUsername(value) {
  const username = value?.trim() ?? "";
  if (!username) return "Pick a username.";
  if (username.length < MIN_USERNAME_LENGTH) return "That's a little short.";
  if (username.length > MAX_USERNAME_LENGTH) {
    return `Keep it under ${MAX_USERNAME_LENGTH} characters.`;
  }
  return null;
}

export function validateConfirmation(password, confirmation) {
  if (!confirmation) return "Repeat your password.";
  if (password !== confirmation) return "Those passwords don't match.";
  return null;
}

/**
 * Run a `{ field: () => string|null }` map and collect the failures.
 *
 * @returns {{ errors: Record<string,string>, isValid: boolean }}
 */
export function runValidators(validators) {
  const errors = {};

  for (const [field, validate] of Object.entries(validators)) {
    const error = validate();
    if (error) errors[field] = error;
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}
