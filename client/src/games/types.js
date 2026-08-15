/**
 * The contract every game on the platform implements.
 *
 * The platform (auth, config, routing, the games list, the host) knows
 * nothing about any particular game. It only knows this shape. Adding a game
 * means writing a module and registering it — no platform code changes.
 *
 * The important seam is `useSession`. A game supplies its own state adapter,
 * so how state arrives is the game's business, not the platform's:
 *
 *   - pass-and-play polls REST and advances on user action (GueSpy today)
 *   - a multiplayer game would open a socket and push state
 *
 * Both hand back the same `{ status, data }`, so the host renders either the
 * same way.
 *
 * @typedef {object} GameMeta
 * @property {string} name          display name (falls back to the config's)
 * @property {string} tagline       one line, shown on the game card
 * @property {string} emblem        emoji or short glyph for the card
 * @property {string} [players]     e.g. "3-10 players"
 * @property {string} [length]      e.g. "5 min a round"
 *
 * @typedef {object} GameSession
 * @property {string|null} status   current game state, drives screen choice
 * @property {object|null} data     state-specific payload for that screen
 * @property {boolean} isLoading    a state fetch is in flight
 * @property {Error|null} error     the last fetch failed
 * @property {() => Promise<void>} refresh  re-read state from the server
 *
 * @typedef {object} GameModule
 * @property {string} id            must equal the `gameType` in active_games
 * @property {GameMeta} meta
 * @property {string[]} modes       PLAY_MODES this game supports
 * @property {string} theme         value for [data-game], selects theme.css
 * @property {() => GameSession} useSession   React hook; see the seam above
 * @property {Record<string, React.ComponentType>} screens  status -> screen
 * @property {GameEntry} [entry]    optional resume prompt, shown before the
 *                                  status screens when there is something
 *                                  worth resuming
 *
 * @typedef {object} GameEntry
 * @property {React.ComponentType} Screen  receives { session, onContinue, onNewGame }
 * @property {(session: GameSession) => boolean} shouldShow
 */

/** Play modes a game can declare. The hub badges these on each card. */
export const PLAY_MODES = {
  /** Everyone shares one device and passes it around. */
  PASS_AND_PLAY: "PASS_AND_PLAY",
  /** Each player on their own device. No game implements this yet. */
  ONLINE: "ONLINE",
};

export const PLAY_MODE_LABELS = {
  [PLAY_MODES.PASS_AND_PLAY]: "Pass & play",
  [PLAY_MODES.ONLINE]: "Online",
};

/**
 * Define a game module, failing loudly on a malformed one.
 *
 * These are developer mistakes, not runtime conditions, so they throw at
 * import time rather than degrading — a game that is half-registered would
 * fail later in a much more confusing place.
 *
 * @param {GameModule} module
 * @returns {GameModule}
 */
export function defineGameModule(module) {
  const required = ["id", "meta", "modes", "theme", "useSession", "screens"];

  for (const key of required) {
    if (module[key] == null) {
      throw new Error(`Game module is missing "${key}".`);
    }
  }

  if (typeof module.useSession !== "function") {
    throw new Error(`Game module "${module.id}" must supply useSession as a hook.`);
  }

  if (!Array.isArray(module.modes) || module.modes.length === 0) {
    throw new Error(`Game module "${module.id}" must declare at least one play mode.`);
  }

  const unknownMode = module.modes.find((mode) => !PLAY_MODES[mode]);
  if (unknownMode) {
    throw new Error(`Game module "${module.id}" declares unknown play mode "${unknownMode}".`);
  }

  return module;
}
