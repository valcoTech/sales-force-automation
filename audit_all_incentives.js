import XLSX from 'xlsx';
import fs from 'fs';

const file = 'c:/Users/ALIF/Downloads/Workspace/REACT/BROJECTS/Book3.xlsx';
if (!fs.existsSync(file)) {
  console.error("File does not exist: " + file);
  process.exit(1);
}

const workbook = XLSX.readFile(file);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

// ─── Principal group mapping (same as principalGroups.ts) ───────────
const PRINCIPAL_PATTERNS = {
  "DANPAC PHARMA. PT": ["DANPAC PHARMA"],
  "PT MULIA PUTRA MANDIRI": [
    "PT. MULIA PUTRA MANDIRI",
    "PT MULIA PUTRA MANDIRI",
    "PT MULIA MANDIRI",
  ],
  "AULIA COSMETIC INDONESIA. PT": ["AULIA COSMETIC"],
  "MARTINA BERTO TBK .PT": ["MARTINA BERTO"],
  "SURYA DERMATO MEDICA. PT (OTC)": ["SURYA DERMATO"],
  "UNICHARM TRADING INDONESIA .PT": ["UNICHARM"],
};

function mapToPrincipalGroup(supplierName) {
  if (!supplierName) return "OTHERS";
  const upper = supplierName.toUpperCase().trim();
  for (const [group, patterns] of Object.entries(PRINCIPAL_PATTERNS)) {
    for (const pat of patterns) {
      if (upper.includes(pat.toUpperCase())) {
        return group;
      }
    }
  }
  return "OTHERS";
}

function getVal(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return row[k];
  }
  return undefined;
}

// ─── Filter to June 2026 ────────────────────────────────────────────
const june2026All = data.filter(r => {
  const bln = String(getVal(r, 'BLN', 'bln') ?? '').trim().toLowerCase();
  const year = Number(getVal(r, 'YEAR', 'year') ?? 0);
  return bln === 'june' && year === 2026;
});

console.log(`Total rows June 2026: ${june2026All.length}`);

// Check how many have gs_value <= 0
const zeroOrNegGs = june2026All.filter(r => {
  const gs = Number(getVal(r, 'GS_VALUE', 'gs_value') ?? 0);
  return gs <= 0;
});
console.log(`Rows with gs_value <= 0: ${zeroOrNegGs.length}`);

// Check how many have null/empty cust_ship_id
const noCustShip = june2026All.filter(r => {
  const id = getVal(r, 'CUST_SHIP_ID', 'cust_ship_id');
  return !id || String(id).trim() === '';
});
console.log(`Rows with empty cust_ship_id: ${noCustShip.length}`);

// ─── AUDIT 1: Outlet Transaksi per salesman per group ────────────────
console.log("\n" + "=".repeat(80));
console.log("AUDIT 1: OUTLET TRANSAKSI (OT) — gs_value > 0 only");
console.log("=".repeat(80));

// Only rows with gs_value > 0 AND valid cust_ship_id
const validOTRows = june2026All.filter(r => {
  const gs = Number(getVal(r, 'GS_VALUE', 'gs_value') ?? 0);
  const custId = getVal(r, 'CUST_SHIP_ID', 'cust_ship_id');
  return gs > 0 && custId && String(custId).trim() !== '';
});
console.log(`Valid OT rows (gs_value > 0 + valid cust_ship_id): ${validOTRows.length}`);

// Group by salesman -> supplier -> Set(cust_ship_id) [Method B]
const slsmSupplierOutlets = {}; // slsm -> supplier -> Set
// Also group by salesman -> group -> Set (Method A) for comparison
const slsmGroupOutlets = {}; // slsm -> group -> Set

validOTRows.forEach(r => {
  const slsm = String(getVal(r, 'AR_SLSM_NAME', 'ar_slsm_name') || '').trim();
  const supplier = String(getVal(r, 'SUPPLIER_NAME', 'supplier_name') || '').trim();
  const custId = String(getVal(r, 'CUST_SHIP_ID', 'cust_ship_id')).trim();
  const group = mapToPrincipalGroup(supplier);
  
  if (!slsm || !custId) return;
  
  // Method B: per supplier
  if (!slsmSupplierOutlets[slsm]) slsmSupplierOutlets[slsm] = {};
  if (!slsmSupplierOutlets[slsm][supplier]) slsmSupplierOutlets[slsm][supplier] = new Set();
  slsmSupplierOutlets[slsm][supplier].add(custId);
  
  // Method A: per group
  if (!slsmGroupOutlets[slsm]) slsmGroupOutlets[slsm] = {};
  if (!slsmGroupOutlets[slsm][group]) slsmGroupOutlets[slsm][group] = new Set();
  slsmGroupOutlets[slsm][group].add(custId);
});

// Print results for each salesman
const groupNames = Object.keys(PRINCIPAL_PATTERNS);
const salesmen = Object.keys(slsmSupplierOutlets).sort();

for (const slsm of salesmen) {
  console.log(`\n─── Salesman: "${slsm}" ───`);
  
  // For each group
  for (const group of groupNames) {
    // Method A: deduplicated per group
    const methodA = slsmGroupOutlets[slsm]?.[group]?.size || 0;
    
    // Method B: sum of unique per supplier
    let methodB = 0;
    const supplierDetails = [];
    for (const [sup, supSet] of Object.entries(slsmSupplierOutlets[slsm] || {})) {
      if (mapToPrincipalGroup(sup) === group) {
        methodB += supSet.size;
        supplierDetails.push(`${sup}: ${supSet.size}`);
      }
    }
    
    if (methodA === 0 && methodB === 0) continue;
    
    const flag = methodA !== methodB ? " ⚠️ DIFFERENT!" : " ✅";
    console.log(`  ${group}: MethodA(dedup)=${methodA} | MethodB(sum)=${methodB}${flag}`);
    if (methodA !== methodB) {
      supplierDetails.forEach(d => console.log(`    └ ${d}`));
    }
  }
  
  // Total unique outlets (all groups, deduplicated globally)
  const allOutlets = new Set();
  for (const supSet of Object.values(slsmSupplierOutlets[slsm] || {})) {
    for (const id of supSet) allOutlets.add(id);
  }
  console.log(`  TOTAL ALL OT (global dedup): ${allOutlets.size}`);
}

// ─── AUDIT 2: Check for gs_value <= 0 rows that have a valid cust_ship_id ───
console.log("\n" + "=".repeat(80));
console.log("AUDIT 2: ROWS WITH gs_value <= 0 BUT VALID cust_ship_id (excluded from OT)");
console.log("=".repeat(80));

const excludedButHasCust = june2026All.filter(r => {
  const gs = Number(getVal(r, 'GS_VALUE', 'gs_value') ?? 0);
  const custId = getVal(r, 'CUST_SHIP_ID', 'cust_ship_id');
  return gs <= 0 && custId && String(custId).trim() !== '';
});

// Show by salesman & supplier
const excludedBySlsm = {};
excludedButHasCust.forEach(r => {
  const slsm = String(getVal(r, 'AR_SLSM_NAME', 'ar_slsm_name') || '').trim();
  const sup = String(getVal(r, 'SUPPLIER_NAME', 'supplier_name') || '').trim();
  const custId = String(getVal(r, 'CUST_SHIP_ID', 'cust_ship_id')).trim();
  const gs = Number(getVal(r, 'GS_VALUE', 'gs_value') ?? 0);
  if (!excludedBySlsm[slsm]) excludedBySlsm[slsm] = [];
  excludedBySlsm[slsm].push({ sup, custId, gs });
});

for (const [slsm, rows] of Object.entries(excludedBySlsm)) {
  console.log(`\n  "${slsm}": ${rows.length} rows excluded`);
  // Check if any of these excluded outlets would have changed the OT count
  const uniqueExcluded = {};
  rows.forEach(r => {
    const group = mapToPrincipalGroup(r.sup);
    if (!uniqueExcluded[group]) uniqueExcluded[group] = new Set();
    uniqueExcluded[group].add(r.custId);
  });
  for (const [group, set] of Object.entries(uniqueExcluded)) {
    // Check which of these are NOT already in the valid OT set  
    let extraCount = 0;
    for (const id of set) {
      const alreadyCounted = slsmGroupOutlets[slsm]?.[group]?.has(id);
      if (!alreadyCounted) extraCount++;
    }
    if (extraCount > 0) {
      console.log(`    ⚠️ ${group}: ${extraCount} outlets ONLY appear with gs_value <= 0 (not counted)`);
    }
  }
}

// ─── AUDIT 3: Detailed Unicharm check for Rahmat Ridha ──────────────
console.log("\n" + "=".repeat(80));
console.log("AUDIT 3: RAHMAT RIDHA - UNICHARM DETAILED");
console.log("=".repeat(80));

const rrJune = june2026All.filter(r => {
  const name = String(getVal(r, 'AR_SLSM_NAME', 'ar_slsm_name') || '').toUpperCase().trim();
  return name.includes('RAHMAT RIDHA');
});

const rrUnicharm = rrJune.filter(r => {
  const sup = String(getVal(r, 'SUPPLIER_NAME', 'supplier_name') || '').toUpperCase();
  return sup.includes('UNICHARM');
});

// Group by cust_ship_id and show which have gs_value > 0 vs <= 0
const rrUnicharmByCust = {};
rrUnicharm.forEach(r => {
  const custId = String(getVal(r, 'CUST_SHIP_ID', 'cust_ship_id') || '').trim();
  const custName = String(getVal(r, 'CUST_SHIP_NAME', 'cust_ship_name') || '').trim();
  const gs = Number(getVal(r, 'GS_VALUE', 'gs_value') ?? 0);
  if (!rrUnicharmByCust[custId]) rrUnicharmByCust[custId] = { name: custName, rows: [] };
  rrUnicharmByCust[custId].rows.push(gs);
});

let countGsPos = 0;
let countAll = 0;
for (const [id, info] of Object.entries(rrUnicharmByCust)) {
  countAll++;
  const hasPositive = info.rows.some(gs => gs > 0);
  const hasNegOrZero = info.rows.some(gs => gs <= 0);
  if (hasPositive) countGsPos++;
  
  if (hasNegOrZero) {
    console.log(`  ID: ${id} | "${info.name}" | gs_values: [${info.rows.join(', ')}] ${hasPositive ? '✅ has gs>0' : '❌ ONLY gs<=0'}`);
  }
}
console.log(`\nUnicharm outlets with gs_value > 0: ${countGsPos}`);
console.log(`Unicharm total unique cust_ship_id (any gs_value): ${countAll}`);

// ─── AUDIT 4: ALL salesman - ALL suppliers detailed breakdown ───────
console.log("\n" + "=".repeat(80));
console.log("AUDIT 4: ALL SALESMEN - DETAILED SUPPLIER BREAKDOWN");
console.log("=".repeat(80));

for (const slsm of salesmen) {
  console.log(`\n─── "${slsm}" ───`);
  for (const group of groupNames) {
    const suppliers = {};
    for (const [sup, supSet] of Object.entries(slsmSupplierOutlets[slsm] || {})) {
      if (mapToPrincipalGroup(sup) === group) {
        suppliers[sup] = supSet.size;
      }
    }
    if (Object.keys(suppliers).length === 0) continue;
    
    const total = Object.values(suppliers).reduce((a, b) => a + b, 0);
    console.log(`  ${group}: TOTAL=${total}`);
    for (const [sup, count] of Object.entries(suppliers)) {
      console.log(`    └ "${sup}": ${count} unique outlets`);
    }
  }
}

// ─── AUDIT 5: New Principal — check supplier matching ───────────────
console.log("\n" + "=".repeat(80));
console.log("AUDIT 5: NEW PRINCIPAL SUPPLIER MATCHING");
console.log("=".repeat(80));
console.log("Checking if any supplier_name would NOT match New Principal targets.");
console.log("New Principal matching uses: supplierUpper.includes(pg.toUpperCase())");

// Get all unique supplier names in June 2026
const allSuppliersJune = new Set();
june2026All.forEach(r => {
  const sup = getVal(r, 'SUPPLIER_NAME', 'supplier_name');
  if (sup) allSuppliersJune.add(String(sup).trim());
});

console.log(`\nAll unique suppliers in June 2026: ${allSuppliersJune.size}`);
Array.from(allSuppliersJune).sort().forEach(sup => {
  const group = mapToPrincipalGroup(sup);
  console.log(`  "${sup}" → ${group}`);
});

// ─── AUDIT 6: GS_VALUE sums per salesman per group for Sales Incentive ──
console.log("\n" + "=".repeat(80));
console.log("AUDIT 6: GS_VALUE SUMS (for Incentive Sales & New Principal)");
console.log("=".repeat(80));

const slsmGsSums = {}; // slsm -> group -> sum
june2026All.forEach(r => {
  const slsm = String(getVal(r, 'AR_SLSM_NAME', 'ar_slsm_name') || '').trim();
  const sup = String(getVal(r, 'SUPPLIER_NAME', 'supplier_name') || '').trim();
  const gs = Number(getVal(r, 'GS_VALUE', 'gs_value') ?? 0);
  const group = mapToPrincipalGroup(sup);
  
  if (!slsm) return;
  if (!slsmGsSums[slsm]) slsmGsSums[slsm] = {};
  slsmGsSums[slsm][group] = (slsmGsSums[slsm][group] || 0) + gs;
});

for (const slsm of salesmen) {
  console.log(`\n─── "${slsm}" ───`);
  for (const group of [...groupNames, "OTHERS"]) {
    const sum = slsmGsSums[slsm]?.[group];
    if (!sum) continue;
    console.log(`  ${group}: gs_value_sum = ${sum.toLocaleString('id-ID')}`);
  }
}
