-- Migration: Create incentive support tables
-- Run this in Supabase Dashboard > SQL Editor
-- Project: vydvhaujiigtcvblsjer

-- ============================================
-- 1. incentive_targets — Target per principal per salesman per bulan
-- ============================================
CREATE TABLE IF NOT EXISTS incentive_targets (
  id              BIGSERIAL PRIMARY KEY,
  salesman_name   TEXT NOT NULL,
  principal_group TEXT NOT NULL,
  target_value    NUMERIC(18,2) DEFAULT 0,
  bln             TEXT NOT NULL,
  year            INTEGER NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  uploaded_by     UUID REFERENCES auth.users(id),
  UNIQUE(salesman_name, principal_group, bln, year)
);

CREATE INDEX IF NOT EXISTS idx_incentive_targets_lookup
  ON incentive_targets (salesman_name, bln, year);

ALTER TABLE incentive_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supervisor_full_access_incentive_targets"
  ON incentive_targets FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'supervisor')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'supervisor')
  );

CREATE POLICY "salesman_read_own_incentive_targets"
  ON incentive_targets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role = 'salesman'
        AND users.full_name = incentive_targets.salesman_name
    )
  );

-- ============================================
-- 2. incentive_target_outlets — Target outlet per principal per salesman
-- ============================================
CREATE TABLE IF NOT EXISTS incentive_target_outlets (
  id              BIGSERIAL PRIMARY KEY,
  salesman_name   TEXT NOT NULL,
  principal_group TEXT NOT NULL,
  target_outlet   INTEGER DEFAULT 0,
  total_outlet    INTEGER DEFAULT 0,
  bln             TEXT NOT NULL,
  year            INTEGER NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  uploaded_by     UUID REFERENCES auth.users(id),
  UNIQUE(salesman_name, principal_group, bln, year)
);

CREATE INDEX IF NOT EXISTS idx_incentive_target_outlets_lookup
  ON incentive_target_outlets (salesman_name, bln, year);

ALTER TABLE incentive_target_outlets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supervisor_full_access_target_outlets"
  ON incentive_target_outlets FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'supervisor')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'supervisor')
  );

CREATE POLICY "salesman_read_own_target_outlets"
  ON incentive_target_outlets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role = 'salesman'
        AND users.full_name = incentive_target_outlets.salesman_name
    )
  );

-- ============================================
-- 3. incentive_new_principal_targets — Target untuk new principal
-- ============================================
CREATE TABLE IF NOT EXISTS incentive_new_principal_targets (
  id              BIGSERIAL PRIMARY KEY,
  salesman_name   TEXT NOT NULL,
  principal_group TEXT NOT NULL,
  target_value    NUMERIC(18,2) DEFAULT 0,
  bln             TEXT NOT NULL,
  year            INTEGER NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  uploaded_by     UUID REFERENCES auth.users(id),
  UNIQUE(salesman_name, principal_group, bln, year)
);

CREATE INDEX IF NOT EXISTS idx_incentive_new_principal_targets_lookup
  ON incentive_new_principal_targets (salesman_name, bln, year);

ALTER TABLE incentive_new_principal_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supervisor_full_access_new_principal_targets"
  ON incentive_new_principal_targets FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'supervisor')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'supervisor')
  );

CREATE POLICY "salesman_read_own_new_principal_targets"
  ON incentive_new_principal_targets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role = 'salesman'
        AND users.full_name = incentive_new_principal_targets.salesman_name
    )
  );

-- ============================================
-- 4. incentive_reward_tiers — Konfigurasi tier reward
-- ============================================
CREATE TABLE IF NOT EXISTS incentive_reward_tiers (
  id              BIGSERIAL PRIMARY KEY,
  incentive_type  TEXT NOT NULL,  -- 'sales', 'new_principal', 'outlet'
  tier_name       TEXT NOT NULL,
  min_pct         NUMERIC(5,2),
  max_pct         NUMERIC(5,2),
  min_outlet      INTEGER,
  reward_amount   NUMERIC(18,2) NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE incentive_reward_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_reward_tiers"
  ON incentive_reward_tiers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "supervisor_manage_reward_tiers"
  ON incentive_reward_tiers FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'supervisor')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = (SELECT auth.uid()) AND users.role = 'supervisor')
  );

-- ============================================
-- 5. Seed default reward tiers
-- ============================================

-- Incentive Sales tiers
INSERT INTO incentive_reward_tiers (incentive_type, tier_name, min_pct, max_pct, reward_amount) VALUES
  ('sales', '85% - < 95%', 85, 94.99, 1200000),
  ('sales', '96% - ≤ 100%', 96, 100, 2000000),
  ('sales', '> 100%', 100.01, 999, 2500000);

-- Incentive New Principal tiers
INSERT INTO incentive_reward_tiers (incentive_type, tier_name, min_pct, max_pct, reward_amount) VALUES
  ('new_principal', '85% - < 95%', 85, 94.99, 250000),
  ('new_principal', '96% - ≤ 100%', 96, 100, 500000),
  ('new_principal', '> 100%', 100.01, 999, 1000000);

-- Incentive Outlet tiers (by total outlet transaksi)
INSERT INTO incentive_reward_tiers (incentive_type, tier_name, min_outlet, reward_amount) VALUES
  ('outlet', '< 90 Outlet', 0, -100000),
  ('outlet', '90 Outlet Transaksi', 90, 1000000),
  ('outlet', '110 Outlet Transaksi', 110, 1200000),
  ('outlet', '150 Outlet Transaksi', 150, 2000000);
