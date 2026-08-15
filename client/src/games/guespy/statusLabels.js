/**
 * Human descriptions of GueSpy's server-side game states.
 *
 * Used to tell a returning player where they left off. Kept beside the game
 * rather than in the platform, because these strings only mean anything to
 * this game.
 */
export const STATUS_LABELS = {
  NOT_STARTED: "Not started",
  CATEGORY_SELECTION: "Choosing a category",
  GROUP_SELECTION: "Choosing players",
  GAME_OPTION_SELECTION: "Setting the number of spies",
  WORD_AND_SPY_REVEAL: "Handing out roles",
  DISCUSSION_TIME: "Discussion in progress",
  VOTING: "Voting",
  REVOTE: "Revoting after a tie",
  SPY_GUESS: "A caught spy is guessing the word",
  ROUND_END: "Between rounds",
  SCORING: "Showing the results",
};

/**
 * States where setup has not produced anything worth keeping.
 *
 * Landing on one of these means there is nothing to resume, so the player is
 * taken straight in rather than being asked to choose between continuing and
 * restarting an empty game.
 */
const FRESH_STATUSES = new Set([null, undefined, "NOT_STARTED", "CATEGORY_SELECTION"]);

export function isResumable(status) {
  return !FRESH_STATUSES.has(status);
}

export function describeStatus(status) {
  return STATUS_LABELS[status] ?? "In progress";
}
