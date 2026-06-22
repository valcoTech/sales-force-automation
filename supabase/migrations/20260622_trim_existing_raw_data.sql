-- Migration: Trim trailing/leading spaces from important columns in raw_data table
-- Run this in Supabase Dashboard > SQL Editor
-- Project: vydvhaujiigtcvblsjer

UPDATE raw_data
SET 
  ar_slsm_name = TRIM(ar_slsm_name),
  cust_ship_id = TRIM(cust_ship_id),
  cust_ship_name = TRIM(cust_ship_name),
  supplier_name = TRIM(supplier_name),
  bln = TRIM(bln),
  month = TRIM(month);
