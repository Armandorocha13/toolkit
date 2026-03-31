const ExcelJS = require('exceljs');
const path = require('path');

async function inspectAdjustedView() {
    const workbook = new ExcelJS.Workbook();
    const filePath = 'c:\\Users\\user\\Desktop\\ARQUVOS\\PPROJETOS PROGRAMAÇÃO\\Listagem Toolkit\\dados\\view.xlsx';
    
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        
        console.log("COLUMNS:");
        console.log(JSON.stringify(worksheet.getRow(1).values));
        
        console.log("\nSAMPLE_DATA:");
        for (let i = 2; i <= 10; i++) {
            const row = worksheet.getRow(i).values;
            if (row && row.length > 0) {
                console.log(JSON.stringify(row));
            }
        }
    } catch (err) {
        console.error("Error reading Excel:", err.message);
    }
}

inspectAdjustedView();
