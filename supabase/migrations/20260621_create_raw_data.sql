-- Migration: Create raw_data table for incentive salesman
-- Run this in Supabase Dashboard > SQL Editor
-- Project: vydvhaujiigtcvblsjer

-- 1. Create raw_data table
CREATE TABLE IF NOT EXISTS raw_data (
  id              BIGSERIAL PRIMARY KEY,
  division        TEXT,
  ar_date         TEXT,
  cust_ship_id    TEXT,
  cust_ship_name  TEXT,
  ar_slsm_name    TEXT,
  principal_id    TEXT,
  supplier_name   TEXT,
  prod_id         TEXT,
  prod_name       TEXT,
  prod_uom_id     TEXT,
  unit_list_price NUMERIC(18,2) DEFAULT 0,
  gs_qty          NUMERIC(18,2) DEFAULT 0,
  gs_value        NUMERIC(18,2) DEFAULT 0,
  bln             TEXT,
  month           TEXT,
  year            INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now(),
  uploaded_by     UUID REFERENCES auth.users(id)
);

-- 2. Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_raw_data_bln_year ON raw_data (bln, year);
CREATE INDEX IF NOT EXISTS idx_raw_data_ar_slsm_name ON raw_data (ar_slsm_name);
CREATE INDEX IF NOT EXISTS idx_raw_data_supplier_name ON raw_data (supplier_name);
CREATE INDEX IF NOT EXISTS idx_raw_data_cust_ship_id ON raw_data (cust_ship_id);

-- 3. Enable RLS
ALTER TABLE raw_data ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Supervisor can do everything
CREATE POLICY "supervisor_full_access_raw_data"
  ON raw_data
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'supervisor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'supervisor'
    )
  );

-- Salesman can read their own data
CREATE POLICY "salesman_read_own_raw_data"
  ON raw_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role = 'salesman'
        AND users.full_name = raw_data.ar_slsm_name
    )
  );
