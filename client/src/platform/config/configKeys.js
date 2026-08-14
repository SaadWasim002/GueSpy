/**
 * The server-side settings this frontend reads, with a parser and a fallback
 * for each.
 *
 * Every entry needs a fallback because `/config/get` is allowed to 404 with
 * NO_CONFIG_FOUND, individual keys can be missing (the PRD lists
 * `max_group_allowed` as not yet seeded), and a value that fails to parse
 * must not take a screen down. The rule is: config tunes the game, it never
 * gates it — a missing key degrades to a sensible default rather than an
 * error screen.
 */

const toNumber = (raw) => {
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

const toJson = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const CONFIG_SCHEMA = {
  minPlayersInGroup: { key: "min_player_allowed_in_group", parse: toNumber, fallback: 3 },
  maxPlayersInGroup: { key: "max_player_allowed_in_group", parse: toNumber, fallback: 12 },
  maxGroups: { key: "max_group_allowed", parse: toNumber, fallback: 10 },
  minSpies: { key: "min_spy_allowed", parse: toNumber, fallback: 1 },
  maxSpies: { key: "max_spy_allowed", parse: toNumber, fallback: 2 },
  /** Seconds. */
  discussionDuration: { key: "discussion_duration", parse: toNumber, fallback: 180 },
  /** Applied server-side; the frontend reads it only to explain the numbers. */
  scoringConfig: { key: "scoring_config", parse: toJson, fallback: null },
  /**
   * Drives the game-selection screen. The fallback keeps the platform usable
   * if the row is missing: GueSpy is the only shipped game today.
   */
  activeGames: {
    key: "active_games",
    parse: toJson,
    fallback: [
      {
        gameType: "GUESPY",
        name: "GueSpy",
        description: "Word-based spy party game",
        enabled: true,
      },
    ],
  },
};

/**
 * Fold the raw `[{ key, value }]` rows into the named settings above.
 * Unknown rows are ignored — the backend may hold admin-only keys this
 * frontend has no business knowing about.
 */
export function resolveSettings(rows = []) {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  return Object.fromEntries(
    Object.entries(CONFIG_SCHEMA).map(([name, { key, parse, fallback }]) => {
      if (!byKey.has(key)) return [name, fallback];
      const parsed = parse(byKey.get(key));
      return [name, parsed === undefined ? fallback : parsed];
    }),
  );
}
