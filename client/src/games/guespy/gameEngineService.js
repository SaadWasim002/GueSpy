import { api, envelope, unwrap } from "../../lib/api";
import { ApiError } from "../../lib/apiError";

/**
 * GueSpy's game-engine endpoints.
 *
 * These live inside the game module rather than in a shared services folder:
 * the engine's vocabulary (spies, votes, role reveal) is specific to this
 * game, and a second game would have an entirely different one.
 */

/**
 * GET /game-engine/game-state → `{ gameStatus, ...stateSpecificFields }`.
 *
 * Renamed from `/get-screen`, which no longer exists. Every screen transition
 * in the game runs through this one call, so the old path 404s the entire
 * flow rather than degrading.
 *
 * Note the shape: the server returns a `GameStatusData` object *as* the data
 * payload, so `gameStatus` is nested inside `data` rather than being a
 * sibling of it. Unwrapped here once, correctly.
 *
 *   {"data":{"gameStatus":"NOT_STARTED"},"message":"…","status":"200 OK"}
 */
export async function fetchScreen() {
  const response = await api.get("/game-engine/game-state");
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

/**
 * POST /game-engine/spy-guess — a spy names the word.
 *
 * Accepted while the game is at SPY_GUESS (a caught spy's one chance) and
 * also during DISCUSSION_TIME, VOTING and REVOTE, which is how a spy can
 * call it early. Either way the round ends: a correct guess wins it for the
 * spies, a wrong one hands it to the innocents.
 */
export async function submitSpyGuess(word) {
  await api.post("/game-engine/spy-guess", { word });
}

/**
 * POST /game-engine/spy-decline — a caught spy passes on guessing.
 *
 * They are eliminated. If they were the last spy the innocents win outright;
 * otherwise the game continues to the next round, or ends there if too few
 * players remain. Valid only at SPY_GUESS.
 */
export async function declineSpyGuess() {
  await api.post("/game-engine/spy-decline");
}

/**
 * POST /game-engine/next-round — leave the round-end interstitial.
 *
 * Starts a fresh discussion timer and returns the game to DISCUSSION_TIME.
 * Valid only at ROUND_END.
 */
export async function startNextRound() {
  await api.post("/game-engine/next-round");
}

/**
 * POST /game-engine/game-state — step back through setup, or skip forward
 * past the discussion timer.
 *
 * `action` is "back" or "forward" (the server compares case-insensitively).
 * Back is accepted at CATEGORY_SELECTION, GROUP_SELECTION,
 * GAME_OPTION_SELECTION, WORD_AND_SPY_REVEAL and DISCUSSION_TIME, and each
 * one clears the data owned by the state being left; forward is only ever
 * DISCUSSION_TIME → VOTING. Anything else is a 400.
 *
 * The response body is the resulting state, in the same shape `fetchScreen`
 * returns — so the caller can write it straight into the session rather than
 * following up with a GET and flickering between the two.
 *
 * The guard below is not paranoia. An unrecognised action answers
 * `ResponseEnum.INVALID_DATA`, which is declared `HttpStatus.OK`, so a
 * *failure* arrives as a 200 with no `data` and would otherwise sail through
 * as an empty state that blanks the game. Unreachable from here — this
 * client only ever sends the two valid actions — but the cost of checking is
 * one line and the cost of not checking is a wiped screen.
 */
export async function navigateGameState(action) {
  const response = await api.post("/game-engine/game-state", { action });
  const state = unwrap(response);

  if (!state?.gameStatus) {
    throw new ApiError({
      status: response?.status ?? 200,
      message: envelope(response)?.message || "The server didn't return a game state.",
    });
  }

  return state;
}
