-- Migration: Add apoteker approval columns to transactions table
-- Run this in Supabase Dashboard > SQL Editor
-- Project: vydvhaujiigtcvblsjer

-- 1. Add apoteker_status column (pending by default)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS apoteker_status TEXT DEFAULT 'pending'
    CHECK (apoteker_status IN ('pending', 'approved', 'rejected'));

-- 2. Add apoteker_note column for optional notes/reject reasons
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS apoteker_note TEXT DEFAULT NULL;

-- 3. Add index for fast filtering by apoteker_status
CREATE INDEX IF NOT EXISTS idx_transactions_apoteker_status
  ON transactions (apoteker_status);

-- 4. Verify the columns were added successfully
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN ('apoteker_status', 'apoteker_note')
ORDER BY column_name;
