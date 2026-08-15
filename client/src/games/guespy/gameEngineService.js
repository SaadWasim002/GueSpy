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
