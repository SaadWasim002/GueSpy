-- The game logic supports at most 2 spies (see GameOptionRequest @Max(2) and the
-- number-of-spy validation). The frontend reads max_spy_allowed to bound its
-- stepper, so align it with the game rules. No-op on databases where the key
-- was never seeded.
UPDATE app_config SET config_value = '2' WHERE config_key = 'max_spy_allowed';
