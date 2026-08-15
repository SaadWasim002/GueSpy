/**
 * The setup flow, as the player experiences it.
 *
 * Setup is three server states in a row, and without a visible trail there is
 * no way to tell whether picking a category is the first of two screens or
 * the first of six. The ids are the backend's own statuses so a screen can
 * pass its status straight through.
 */
export const SETUP_STEPS = [
  { id: "CATEGORY_SELECTION", label: "Category" },
  { id: "GROUP_SELECTION", label: "Players" },
  { id: "GAME_OPTION_SELECTION", label: "Spies" },
  { id: "WORD_AND_SPY_REVEAL", label: "Play" },
];
