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

// Principal group mapping patterns
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

// 1. Get all unique supplier names across the entire dataset (where gs_value > 0)
const allActiveSuppliers = new Set();
data.forEach(r => {
  const gsValue = Number(r['GS_VALUE'] || r['gs_value'] || 0);
  const supplier = r['SUPPLIER_NAME'] || r['supplier_name'];
  if (gsValue > 0 && supplier) {
    allActiveSuppliers.add(String(supplier).trim());
  }
});

console.log("=== ALL SUPPLIER NAMES & MAPPINGS ===");
const mappingSummary = {
  "DANPAC PHARMA. PT": [],
  "PT MULIA PUTRA MANDIRI": [],
  "AULIA COSMETIC INDONESIA. PT": [],
  "MARTINA BERTO TBK .PT": [],
  "SURYA DERMATO MEDICA. PT (OTC)": [],
  "UNICHARM TRADING INDONESIA .PT": [],
  "OTHERS": []
};

Array.from(allActiveSuppliers).sort().forEach(sup => {
  const group = mapToPrincipalGroup(sup);
  mappingSummary[group].push(sup);
});

for (const [group, suppliers] of Object.entries(mappingSummary)) {
  console.log(`\nPrincipal Group: "${group}"`);
  if (suppliers.length === 0) {
    console.log("  (None)");
  } else {
    suppliers.forEach(s => console.log(`  - "${s}"`));
  }
}

// Check specifically for June-2026 for Rahmat Ridha including all gs_value
console.log("\n==================================================");
console.log("=== RAHMAT RIDHA - JUNE 2026 UNICHARM & AULIA RAW ROWS ===");
const rawJuneRows = data.filter(r => {
  const name = String(r['AR_SLSM_NAME'] || r['ar_slsm_name'] || '').toUpperCase().trim();
  const bln = String(r['BLN'] ?? r['bln'] ?? '').trim();
  const year = Number(r['YEAR'] ?? r['year'] ?? 0);
  return name.includes('RAHMAT RIDHA') && bln.toLowerCase() === 'june' && year === 2026;
});

const unicharmRows = rawJuneRows.filter(r => {
  const sup = String(r['SUPPLIER_NAME'] || r['supplier_name'] || '').toUpperCase();
  return sup.includes('UNICHARM');
});

console.log(`\nUnicharm Raw Rows (${unicharmRows.length} rows):`);
unicharmRows.forEach((r, idx) => {
  console.log(`[${idx+1}] ID: ${r['CUST_SHIP_ID'] || r['cust_ship_id']} | Name: ${r['CUST_SHIP_NAME'] || r['cust_ship_name']} | GS Value: ${r['GS_VALUE'] || r['gs_value']}`);
});

const auliaRows = rawJuneRows.filter(r => {
  const sup = String(r['SUPPLIER_NAME'] || r['supplier_name'] || '').toUpperCase();
  return sup.includes('AULIA');
});

console.log(`\nAulia Raw Rows (${auliaRows.length} rows):`);
auliaRows.forEach((r, idx) => {
  console.log(`[${idx+1}] ID: ${r['CUST_SHIP_ID'] || r['cust_ship_id']} | Name: ${r['CUST_SHIP_NAME'] || r['cust_ship_name']} | GS Value: ${r['GS_VALUE'] || r['gs_value']}`);
});


// 3. Check for ALL salesmen in June-2026 to see if there are any other mappings
console.log("\n==================================================");
console.log("=== ALL SALESMEN - JUNE 2026 OUTLETS PER GROUP ===");
const salesmanOutletsByGroup = {}; // slsm -> group -> Set(cust_ship_id)
const salesmanOutletsBySupplier = {}; // slsm -> supplier -> Set(cust_ship_id)

const june2026AllRows = data.filter(r => {
  const bln = String(r['BLN'] ?? r['bln'] ?? '').trim();
  const year = Number(r['YEAR'] ?? r['year'] ?? 0);
  const gsValue = Number(r['GS_VALUE'] ?? r['gs_value'] ?? 0);
  return bln.toLowerCase() === 'june' && year === 2026 && gsValue > 0;
});

june2026AllRows.forEach(r => {
  const slsm = String(r['AR_SLSM_NAME'] || r['ar_slsm_name'] || '').trim().toUpperCase();
  const supplierName = String(r['SUPPLIER_NAME'] || r['supplier_name'] || '').trim();
  const custShipId = String(r['CUST_SHIP_ID'] || r['cust_ship_id'] || '').trim();
  
  if (slsm && supplierName && custShipId) {
    const group = mapToPrincipalGroup(supplierName);
    
    // Group method
    if (!salesmanOutletsByGroup[slsm]) salesmanOutletsByGroup[slsm] = {};
    if (!salesmanOutletsByGroup[slsm][group]) salesmanOutletsByGroup[slsm][group] = new Set();
    salesmanOutletsByGroup[slsm][group].add(custShipId);

    // Supplier method
    if (!salesmanOutletsBySupplier[slsm]) salesmanOutletsBySupplier[slsm] = {};
    if (!salesmanOutletsBySupplier[slsm][supplierName]) salesmanOutletsBySupplier[slsm][supplierName] = new Set();
    salesmanOutletsBySupplier[slsm][supplierName].add(custShipId);
  }
});

console.log("\nCalculated Outlet counts for June-2026 (Method A vs Method B):");
for (const [slsm, groups] of Object.entries(salesmanOutletsByGroup)) {
  console.log(`\nSalesman: "${slsm}"`);
  for (const [group, set] of Object.entries(groups)) {
    if (group === 'OTHERS') continue;
    const methodAVal = set.size;
    
    // Calculate method B (sum of unique outlets per supplier)
    let methodBVal = 0;
    for (const [sup, supSet] of Object.entries(salesmanOutletsBySupplier[slsm])) {
      if (mapToPrincipalGroup(sup) === group) {
        methodBVal += supSet.size;
      }
    }
    
    console.log(`  - ${group}: Method A (Deduplicated) = ${methodAVal} | Method B (Sum of Supplier Unique) = ${methodBVal}`);
  }
}
