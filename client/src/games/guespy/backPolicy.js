/**
 * What "back" means at each point in the game.
 *
 * One table rather than a flag on each screen, because the interesting part
 * is not that a back button exists — it is that the server *clears* the data
 * owned by the state being left, and how much that costs varies enormously.
 * Undoing a category pick is free; leaving the reveal re-deals the whole
 * round. Keeping the four rules side by side is what makes that comparable.
 *
 * Mirrors `GameEngineService.moveBack`. If the server's clearing rules
 * change, this is the file that has to change with them.
 *
 * Each rule is:
 *   label      what the button says — where you land, not the word "Back",
 *              since "Change category" tells you what you get
 *   confirm    present only when the step destroys work
 *   available  optional extra condition beyond the status itself
 */
const BACK_RULES = {
  /*
   * CATEGORY_SELECTION is deliberately absent. The server accepts back here
   * and moves to NOT_STARTED, but the module maps both statuses to
   * CategoryScreen — so the player would press it and watch nothing happen.
   * Leaving the game entirely is what the header's "All games" link is for.
   */

  GROUP_SELECTION: {
    // → CATEGORY_SELECTION, clearing the chosen category.
    label: "Change category",
  },

  GAME_OPTION_SELECTION: {
    // → GROUP_SELECTION, clearing the chosen group.
    label: "Change players",
  },

  WORD_AND_SPY_REVEAL: {
    // → GAME_OPTION_SELECTION, clearing the spies, the word and the progress
    // through the pass. Everything about the round is picked again.
    label: "Change spy count",
    confirm: {
      title: "Deal the round again?",
      body: "The word and the spies are picked from scratch, and everyone who has already looked will need to look again.",
      action: "Re-deal the round",
    },
  },

  DISCUSSION_TIME: {
    // → WORD_AND_SPY_REVEAL. The word and the spies survive; the pass and the
    // timer restart.
    label: "Show the roles again",
    confirm: {
      title: "Pass it round again?",
      body: "The word and the spies stay as they are — the device goes back round the table, and the timer starts over.",
      action: "Pass it round again",
    },
    /*
     * Meant to be round one only — but currently inert, and deliberately so.
     *
     * `moveBack` was written for the first round: it clears `roundNumber`
     * (the reveal then sets it back to 1) while leaving the votes and the
     * eliminated players alone. Going back in round three therefore restarts
     * the counter *and* walks eliminated players through a reveal they are
     * no longer part of. Not a crash — the voting screen still excludes
     * them — but the round number is wrong afterwards.
     *
     * The check that would prevent it is right here and cannot run:
     * `populateDiscussionTimeData` sends the start time, duration, players
     * and starting player, and no round number, so there is nothing to test.
     * It is written keyed on the field it needs rather than left out, so
     * adding `data.setRoundNumber(...)` to that method — one line, exactly
     * what ROUND_END, SPY_GUESS and SCORING already do — switches it on with
     * no change here. Until then this reads as "allow", which is the
     * behaviour without the guard at all.
     */
    available: (data) => (data?.roundNumber ?? 1) <= 1,
  },
};

/**
 * The back rule in force, or null if back is not offered here.
 *
 * @param status  the current game status
 * @param data    the rest of the game-state payload
 */
export function backRuleFor(status, data) {
  const rule = BACK_RULES[status];
  if (!rule) return null;
  if (rule.available && !rule.available(data)) return null;
  return rule;
}

export default BACK_RULES;
