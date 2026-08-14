-- Round-based scoring support.

-- 1. game_status was a hand-created MySQL ENUM, which must be ALTERed every time
--    a new game state is added. Convert it to VARCHAR so new GameStatus values
--    (SPY_GUESS, REVOTE, ROUND_END, ...) need no further schema changes. This
--    matches Hibernate's natural @Enumerated(STRING) mapping.
ALTER TABLE user_game_details
  MODIFY COLUMN game_status VARCHAR(255) NOT NULL DEFAULT 'NOT_STARTED';

-- 2. Seed the tunable scoring config as a single JSON blob (deserialised into
--    ScoringConfig). minPlayersToContinue = X, the minimum active players
--    required to start another round; the rest are per-round point drift and
--    win bonuses. All of it is tuned by editing this one row.
INSERT INTO app_config (is_active, config_key, config_value) VALUES
  (1, 'scoring_config', '{"minPlayersToContinue":3,"spyPointsPerRound":1,"innocentPointsPerRound":1,"spyWinBonus":2,"innocentWinBonus":2}');
