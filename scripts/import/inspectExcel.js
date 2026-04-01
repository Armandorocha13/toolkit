const ExcelJS = require('exceljs');
const path = require('path');

async function inspectExcel(filename) {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, '../../dados', filename);

    console.log(`Reading file: ${filePath}`);
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);

        console.log(`Total rows: ${worksheet.rowCount}`);
        console.log('\n--- First 10 rows ---');
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber <= 5) {
                console.log(`Row ${rowNumber}:`, row.values);
            }
        });
    } catch (err) {
        console.error('Error reading file:', err.message);
    }
}

inspectExcel('listagemFuncionariosInativos.xlsx');