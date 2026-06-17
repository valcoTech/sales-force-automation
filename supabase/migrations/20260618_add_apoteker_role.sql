-- Fix: Add 'apoteker' to the users_role_check constraint
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Drop the existing role check constraint
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Re-add the constraint with 'apoteker' included
ALTER TABLE users
  ADD CONSTRAINT users_role_check
    CHECK (role IN ('salesman', 'supervisor', 'admin_sales', 'admin_claim', 'apoteker'));

-- Step 3: Verify the constraint was updated
SELECT conname, pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname = 'users_role_check';
