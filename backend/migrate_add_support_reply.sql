-- ============================================================
-- Adds admin_reply and replied_at to the existing support_messages
-- table, so an Admin's response to a ticket can be stored and shown
-- back to the user who submitted it.
-- Safe to re-run: IF NOT EXISTS guards both columns.
-- ============================================================

ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS admin_reply TEXT;
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP;

-- Verify
SELECT id, subject, status, admin_reply, replied_at
FROM support_messages
ORDER BY id;