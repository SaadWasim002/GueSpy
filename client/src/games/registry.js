import { guespyModule } from "./guespy";

/**
 * Every game the frontend can run, keyed by the `gameType` the backend uses
 * in the `active_games` config.
 *
 * This list and that config answer two different questions, and both matter:
 * the config says which games the *server* is offering, this registry says
 * which games this *build* knows how to render. The hub intersects them, so
 * a game enabled server-side before the client ships shows as coming soon
 * rather than a broken card.
 *
 * Registering a new game is the only platform-level change a new game needs.
 */
const MODULES = [guespyModule];

const BY_ID = new Map(MODULES.map((module) => [module.id, module]));

/** @returns {import("./types").GameModule | null} */
export function getGameModule(gameType) {
  return BY_ID.get(gameType) ?? null;
}

/** @returns {import("./types").GameModule[]} */
export function listGameModules() {
  return MODULES;
}

export function hasGameModule(gameType) {
  return BY_ID.has(gameType);
}
