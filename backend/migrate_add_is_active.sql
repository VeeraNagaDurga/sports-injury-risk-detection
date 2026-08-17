-- ============================================================
-- Adds the username column to the existing users table.
-- Safe for a table that already has real users in it:
--   1. add the column as nullable first (so this can't fail on existing rows)
--   2. backfill every existing NULL with a guaranteed-unique temporary
--      username (user_<id> - id is already unique, so this can never collide)
--   3. only THEN enforce UNIQUE + NOT NULL, once every row has a value
-- Re-running this is safe - each step only acts on rows that still need it.
-- ============================================================

-- Step 1: add the column (nullable for now)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Step 2: backfill existing users who don't have one yet.
-- These are placeholders, not real chosen usernames - see note below.
UPDATE users SET username = 'user_' || id WHERE username IS NULL;

-- Step 3: enforce uniqueness (also creates an index automatically - a
-- UNIQUE constraint in Postgres IS a btree index, no separate one needed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

-- Step 4: now that every row has a value, require it going forward
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- Verify
SELECT id, email, username, role FROM users ORDER BY id;