-- Every game session now records which game it belongs to, so the engine can
-- be selected by type. Existing rows are all the GueSpy game.
ALTER TABLE user_game_details
  ADD COLUMN game_type varchar(255) NOT NULL DEFAULT 'GUESPY';
