const ExcelJS = require('exceljs');
const path = require('path');

async function inspectExcel(filename) {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, '../../dados', filename);
    
    console.log(`Reading file: ${filePath}`);
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    
    console.log(`Total rows: ${worksheet.rowCount}`);
    console.log('\n--- First 10 rows ---');
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber <= 10) {
            console.log(`Row ${rowNumber}:`, JSON.stringify(row.values));
        }
    });
}

inspectExcel('apoioFuncao.xlsx');
