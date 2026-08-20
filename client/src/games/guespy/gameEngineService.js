import { api, unwrap } from "../../lib/api";

/**
 * GueSpy's game-engine endpoints.
 *
 * These live inside the game module rather than in a shared services folder:
 * the engine's vocabulary (spies, votes, role reveal) is specific to this
 * game, and a second game would have an entirely different one.
 */

/**
 * GET /api/v1/game/state → `{ gameStatus, ...stateSpecificFields }`.
 *
 * Every screen transition in the game runs through this one call.
 *
 * Note the shape: the server returns a `GameStatusData` object *as* the data
 * payload, so `gameStatus` is nested inside `data` rather than being a
 * sibling of it. Unwrapped here once, correctly.
 *
 *   {"data":{"gameStatus":"NOT_STARTED"},"message":"…","status":"200 OK"}
 */
export async function fetchScreen() {
  const response = await api.get("/api/v1/game/state");
  return unwrap(response) ?? {};
}

/** POST /api/v1/game/reset — wipes progress and returns to category selection. */
export async function resetGame() {
  await api.post("/api/v1/game/reset");
}

/**
 * GET /api/v1/game/role-reveal — the next screen in the pass-the-device pass.
 *
 * This is a GET that MUTATES. Each call advances the server's cursor through
 * PASS_DEVICE → ROLE_REVEAL → next player, and persists it. There is no way
 * to read the current screen without consuming it, so it must be called
 * exactly once per screen shown: a duplicate call silently skips a player's
 * role. See RevealScreen for how that is enforced.
 *
 * Returns { screenType, displayText, isLast, categoryName, wordName,
 * playerDetails: { playerName, playerNumber, isSpy } }.
 *
 * `wordName` is null for spies — the backend never sends it over the wire.
 */
export async function fetchRoleReveal() {
  const response = await api.get("/api/v1/game/role-reveal");
  return unwrap(response);
}

/**
 * POST /api/v1/game/options — sets the spy count and deals the round.
 *
 * Valid range is 1 to min(2, players − 1). The caller must clamp before
 * calling this; the backend will reject out-of-range values with 400.
 */
export async function setGameOption(numberOfSpy) {
  await api.post("/api/v1/game/options", { number_of_spy: numberOfSpy });
}

/**
 * POST /api/v1/game/spy/guess — a spy names the word.
 *
 * Accepted at SPY_GUESS and also during DISCUSSION_TIME, VOTING and REVOTE
 * (a spy can call it early). A correct guess wins for the spies; wrong hands
 * it to the innocents.
 */
export async function submitSpyGuess(word) {
  await api.post("/api/v1/game/spy/guess", { word });
}

/**
 * POST /api/v1/game/spy/decline — a caught spy passes on guessing.
 *
 * They are eliminated. If they were the last spy the innocents win outright;
 * otherwise the game continues to the next round, or ends there if too few
 * players remain. Valid only at SPY_GUESS.
 */
export async function declineSpyGuess() {
  await api.post("/api/v1/game/spy/decline");
}

/**
 * POST /api/v1/game/rounds/next — leave the round-end interstitial.
 *
 * Starts a fresh discussion timer and returns the game to DISCUSSION_TIME.
 * Valid only at ROUND_END.
 */
export async function startNextRound() {
  await api.post("/api/v1/game/rounds/next");
}
