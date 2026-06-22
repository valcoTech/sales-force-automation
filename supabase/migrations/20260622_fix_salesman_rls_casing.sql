-- Migration: Fix salesman RLS policies case-sensitivity and trailing spaces
-- Run this in Supabase Dashboard > SQL Editor
-- Project: vydvhaujiigtcvblsjer

-- 1. Fix RLS for raw_data table
DROP POLICY IF EXISTS "salesman_read_own_raw_data" ON raw_data;
CREATE POLICY "salesman_read_own_raw_data"
  ON raw_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'salesman'
        AND LOWER(TRIM(users.full_name)) = LOWER(TRIM(raw_data.ar_slsm_name))
    )
  );

-- 2. Fix RLS for incentive_targets table
DROP POLICY IF EXISTS "salesman_read_own_incentive_targets" ON incentive_targets;
CREATE POLICY "salesman_read_own_incentive_targets"
  ON incentive_targets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'salesman'
        AND LOWER(TRIM(users.full_name)) = LOWER(TRIM(incentive_targets.salesman_name))
    )
  );

-- 3. Fix RLS for incentive_target_outlets table
DROP POLICY IF EXISTS "salesman_read_own_target_outlets" ON incentive_target_outlets;
CREATE POLICY "salesman_read_own_target_outlets"
  ON incentive_target_outlets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'salesman'
        AND LOWER(TRIM(users.full_name)) = LOWER(TRIM(incentive_target_outlets.salesman_name))
    )
  );

-- 4. Fix RLS for incentive_new_principal_targets table
DROP POLICY IF EXISTS "salesman_read_own_new_principal_targets" ON incentive_new_principal_targets;
CREATE POLICY "salesman_read_own_new_principal_targets"
  ON incentive_new_principal_targets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'salesman'
        AND LOWER(TRIM(users.full_name)) = LOWER(TRIM(incentive_new_principal_targets.salesman_name))
    )
  );
