-- Fast filter lookups for incentive dropdowns (avoids paginating 100k+ raw_data rows)

CREATE OR REPLACE FUNCTION get_incentive_periods()
RETURNS TABLE (bln text, month text, year integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT bln, month, year
  FROM (
    SELECT DISTINCT
      r.bln,
      COALESCE(NULLIF(TRIM(r.month), ''), r.bln) AS month,
      r.year
    FROM raw_data r
    WHERE r.bln IS NOT NULL AND r.year IS NOT NULL

    UNION

    SELECT DISTINCT
      t.bln,
      t.bln AS month,
      t.year
    FROM incentive_targets t
    WHERE t.bln IS NOT NULL AND t.year IS NOT NULL
  ) periods;
$$;

CREATE OR REPLACE FUNCTION get_incentive_salesmen()
RETURNS TABLE (salesman_name text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT TRIM(name) AS salesman_name
  FROM (
    SELECT r.ar_slsm_name AS name
    FROM raw_data r
    WHERE r.ar_slsm_name IS NOT NULL AND TRIM(r.ar_slsm_name) <> ''

    UNION

    SELECT t.salesman_name AS name
    FROM incentive_targets t
    WHERE t.salesman_name IS NOT NULL AND TRIM(t.salesman_name) <> ''
  ) salesmen
  WHERE TRIM(name) <> ''
  ORDER BY salesman_name;
$$;

GRANT EXECUTE ON FUNCTION get_incentive_periods() TO authenticated;
GRANT EXECUTE ON FUNCTION get_incentive_salesmen() TO authenticated;
