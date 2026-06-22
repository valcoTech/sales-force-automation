import XLSX from 'xlsx';
import fs from 'fs';

const files = ['Book2.xlsx', 'Book3.xlsx'];

files.forEach(file => {
  const filePath = `c:/Users/ALIF/Downloads/Workspace/REACT/BROJECTS/${file}`;
  if (!fs.existsSync(filePath)) {
    console.log(`File ${file} does not exist.`);
    return;
  }
  
  console.log(`\n===================================`);
  console.log(`Analyzing file: ${file}`);
  
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Filter rows for Rahmat Ridha, June 2026, gs_value > 0
    const ridhaJuneRows = data.filter(r => {
      const name = String(r['AR_SLSM_NAME'] || r['ar_slsm_name'] || '').toUpperCase().trim();
      const bln = String(r['BLN'] ?? r['bln'] ?? '').trim();
      const year = Number(r['YEAR'] ?? r['year'] ?? 0);
      const gsValue = Number(r['GS_VALUE'] ?? r['gs_value'] ?? 0);
      return name.includes('RAHMAT RIDHA') && bln.toLowerCase() === 'june' && year === 2026 && gsValue > 0;
    });

    console.log(`Total active rows for Rahmat Ridha in June 2026: ${ridhaJuneRows.length}`);

    // Group by supplier name and collect unique outlets
    const supplierOutlets = {};
    ridhaJuneRows.forEach(r => {
      const supplier = String(r['SUPPLIER_NAME'] || r['supplier_name'] || '').trim();
      const custId = String(r['CUST_SHIP_ID'] || r['cust_ship_id'] || '').trim();
      const custName = String(r['CUST_SHIP_NAME'] || r['cust_ship_name'] || '').trim();
      
      if (!supplierOutlets[supplier]) {
        supplierOutlets[supplier] = {};
      }
      supplierOutlets[supplier][custId] = custName;
    });

    for (const [supplier, outlets] of Object.entries(supplierOutlets)) {
      const ids = Object.keys(outlets);
      console.log(`\nSupplier: "${supplier}" (Total unique outlets: ${ids.length})`);
      ids.forEach(id => {
        console.log(`  - ID: ${id} | Name: ${outlets[id]}`);
      });
    }

  } catch (err) {
    console.error(`Error analyzing ${file}:`, err);
  }
});
