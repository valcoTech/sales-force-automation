import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let supabaseUrl = '';
let supabaseKey = '';

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
      supabaseUrl = value;
    } else if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') {
      supabaseKey = value;
    }
  }
} catch (e) {
  console.error("Failed to read .env.local", e);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log("Querying distinct ar_slsm_name from raw_data...");
  const { data: raw, error } = await supabase
    .from('raw_data')
    .select('ar_slsm_name')
    .limit(5000);
  
  if (error) {
    console.error("Error fetching raw_data:", error);
  } else {
    const names = Array.from(new Set(raw.map(r => r.ar_slsm_name)));
    console.log("Distinct ar_slsm_name in raw_data (first 5000 rows):", names);
  }

  // Let's also check if we can select raw_data as a salesman (using Rahmat Ridha's ID)
  // Wait, we can't easily sign in without password, but we can check if there are rows for RAHMAT RIDHA in June 2026.
  const { data: juneRows, error: juneError } = await supabase
    .from('raw_data')
    .select('id, ar_slsm_name')
    .eq('ar_slsm_name', 'RAHMAT RIDHA')
    .eq('bln', 'June')
    .eq('year', 2026);
  
  if (juneError) {
    console.error("Error fetching june rows:", juneError);
  } else {
    console.log(`RAHMAT RIDHA june 2026 rows count: ${juneRows.length}`);
  }
}

checkData();
