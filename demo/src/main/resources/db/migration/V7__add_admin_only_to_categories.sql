-- Add admin_only flag to categories.
-- Existing categories default to false (visible to all users).
ALTER TABLE categories ADD COLUMN admin_only BOOLEAN NOT NULL DEFAULT false;
