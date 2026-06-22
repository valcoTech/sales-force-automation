import XLSX from 'xlsx';
import fs from 'fs';

const files = [
  'Book2.xlsx',
  'Book3.xlsx',
  'Target New Principal.xlsx',
  'target salesman.xlsx',
  'target_ot.xlsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`File ${file} does not exist.`);
    return;
  }
  console.log(`\n===================================`);
  console.log(`Analyzing file: ${file}`);
  try {
    const workbook = XLSX.readFile(file);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Read only first few rows to speed up, especially for large files like Book3
    // sheet_to_json normally reads everything. For Book3, let's limit it if possible, 
    // or just let it load since it's 10MB (which is totally fine to load in a few seconds in Node).
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
    console.log(`Range: ${worksheet['!ref']}`);
    
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Total rows: ${data.length}`);
    
    if (data.length === 0) {
      console.log(`Empty sheet.`);
      return;
    }
    
    const headers = Object.keys(data[0]);
    console.log('Headers:', headers);
    
    const uniqueBln = new Set();
    const uniqueMonth = new Set();
    const uniqueYear = new Set();
    
    data.forEach((row, i) => {
      uniqueBln.add(row['BLN'] ?? row['bln']);
      uniqueMonth.add(row['MONTH'] ?? row['month']);
      uniqueYear.add(row['YEAR'] ?? row['year']);
    });
    
    console.log('Unique BLN values:', Array.from(uniqueBln).slice(0, 10));
    console.log('Unique MONTH values:', Array.from(uniqueMonth).slice(0, 10));
    console.log('Unique YEAR values:', Array.from(uniqueYear).slice(0, 10));
    console.log('Sample Row 1:', data[0]);
  } catch (err) {
    console.error(`Error analyzing ${file}:`, err);
  }
});
