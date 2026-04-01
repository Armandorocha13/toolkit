const ExcelJS = require('exceljs');
const path = require('path');

async function checkHeaders() {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.resolve('c:/Users/user/Desktop/ARQUVOS/PPROJETOS PROGRAMAÇÃO/Listagem Toolkit/dados/listagemFuncionariosInativos.xlsx');
    
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        const firstRow = worksheet.getRow(1);
        
        console.log('--- HEADERS ---');
        firstRow.eachCell((cell, colNumber) => {
            console.log(`${colNumber}: ${cell.value}`);
        });
        console.log('--- END HEADERS ---');
    } catch (e) {
        console.error('Error reading file:', e.message);
    }
}

checkHeaders();
