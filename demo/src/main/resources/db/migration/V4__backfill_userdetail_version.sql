-- The @Version column was introduced without backfilling existing rows, leaving
-- their version NULL. Hibernate throws a NullPointerException when it tries to
-- increment a NULL version on update. Backfill to 0 and enforce NOT NULL so it
-- cannot recur.
UPDATE user_game_details SET version = 0 WHERE version IS NULL;
ALTER TABLE user_game_details MODIFY COLUMN version BIGINT NOT NULL DEFAULT 0;
