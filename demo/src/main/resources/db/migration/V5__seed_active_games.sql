-- The games available on the platform, shown on the game-selection screen.
-- A single JSON array; each entry has the gameType (matching the GameType enum),
-- a display name, a short description, and an enabled flag. Toggle/add games by
-- editing this one row. GueSpy is the only game today.
INSERT INTO app_config (is_active, config_key, config_value) VALUES
  (1, 'active_games', '[{"gameType":"GUESPY","name":"GueSpy","description":"Word-based spy party game","enabled":true}]');
