/**
 * The server-side settings this frontend reads, with a parser and a fallback
 * for each.
 *
 * `kind` says what shape a value is meant to be. The player-facing code does
 * not need it — `parse` already covers reading — but the admin editor does:
 * it is what lets a value be checked *before* it is saved, so a typo in a
 * JSON setting is refused rather than written and discovered later by every
 * player at once.
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
  minPlayersInGroup: { key: "min_player_allowed_in_group", kind: "number", parse: toNumber, fallback: 3 },
  maxPlayersInGroup: { key: "max_player_allowed_in_group", kind: "number", parse: toNumber, fallback: 12 },
  maxGroups: { key: "max_group_allowed", kind: "number", parse: toNumber, fallback: 10 },
  minSpies: { key: "min_spy_allowed", kind: "number", parse: toNumber, fallback: 1 },
  maxSpies: { key: "max_spy_allowed", kind: "number", parse: toNumber, fallback: 2 },
  /*
   * `discussion_duration` is deliberately absent.
   *
   * The discussion length now arrives on the game-state payload as
   * `discussionDuration`, which is the value the engine itself used to
   * compute the deadline. Reading it from config instead let the two drift:
   * /config/get serves the database while the engine serves its own cache,
   * so a row edited directly in the database had the client counting down
   * from ten minutes while the server ended discussion after twenty seconds.
   */
  /** Applied server-side; the frontend reads it only to explain the numbers. */
  scoringConfig: { key: "scoring_config", kind: "json", parse: toJson, fallback: null },
  /**
   * Drives the game-selection screen. The fallback keeps the platform usable
   * if the row is missing: GueSpy is the only shipped game today.
   */
  activeGames: {
    key: "active_games",
    kind: "json",
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

/**
 * Keys this frontend does not *read*, but whose shape it knows.
 *
 * The distinction matters. `discussion_duration` is deliberately absent from
 * CONFIG_SCHEMA above — the game takes the duration off the DISCUSSION_TIME
 * payload now, and reading it from config as well is exactly what let the
 * client and the engine drift apart. But the engine still very much reads
 * it, and an admin typing "ten" into it would break every round.
 *
 * Listing it here lets the admin editor check the value without folding it
 * back into `settings`, which is the part that must not come back.
 */
const KNOWN_KEY_SHAPES = {
  discussion_duration: { key: "discussion_duration", kind: "number", parse: toNumber },
};

/**
 * The shape this frontend expects for a config key, or null if it has no
 * opinion about that key.
 *
 * The admin editor lists whatever the server holds, including keys that are
 * none of this frontend's business, so "no opinion" is a normal answer — it
 * means "show it, let it be edited, but do not pretend to validate it".
 */
export function findConfigSchema(key) {
  return (
    Object.values(CONFIG_SCHEMA).find((entry) => entry.key === key) ?? KNOWN_KEY_SHAPES[key] ?? null
  );
}
