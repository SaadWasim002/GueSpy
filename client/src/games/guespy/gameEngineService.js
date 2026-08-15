import { api, unwrap } from "../../lib/api";

/**
 * GueSpy's game-engine endpoints.
 *
 * These live inside the game module rather than in a shared services folder:
 * the engine's vocabulary (spies, votes, role reveal) is specific to this
 * game, and a second game would have an entirely different one.
 */

/**
 * GET /game-engine/get-screen → `{ gameStatus, ...stateSpecificFields }`.
 *
 * Note the shape. The PRD's examples show `gameStatus` as a sibling of
 * `data`, at the response root — it is not. The server returns a
 * `GameStatusData` object *as* the data payload, so the status is nested
 * inside it, verified against a running backend:
 *
 *   {"data":{"gameStatus":"NOT_STARTED"},"message":"…","status":"200 OK"}
 *
 * Reading it from the root yields undefined and breaks every screen
 * transition, so it is unwrapped here once and correctly.
 */
export async function fetchScreen() {
  const response = await api.get("/game-engine/get-screen");
  return unwrap(response) ?? {};
}

/** POST /game-engine/reset — wipes progress and returns to category selection. */
export async function resetGame() {
  await api.post("/game-engine/reset");
}

/**
 * GET /game-engine/role-reveal — the next screen in the pass-the-device pass.
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
 * `wordName` is present on every response, including a spy's — hiding it is
 * the client's job. See RevealScreen.
 */
export async function fetchRoleReveal() {
  const response = await api.get("/game-engine/role-reveal");
  return unwrap(response);
}

/**
 * POST /game-engine/game-option — sets the spy count and deals the round.
 *
 * The server accepts any value ≥ 1 here: there is no upper bound on the DTO
 * and no check against the player count. Passing more spies than there are
 * players makes the engine's spy-picking loop unsatisfiable and it never
 * returns, so the caller must clamp. See GameOptionScreen for the bound.
 */
export async function setGameOption(numberOfSpy) {
  await api.post("/game-engine/game-option", { number_of_spy: numberOfSpy });
}
