const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dldvrpiwdenxpknquvpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wXrXxklY847tvHXdnY9RkA_aysrKB3X';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function cleanID(id) {
    if (!id) return null;
    let s = id.toString().trim();
    return s.padStart(6, '0');
}

async function crossCheck() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('dados/view.xlsx');
    const worksheet = workbook.getWorksheet(1);
    
    // Fetch unique techs from DB to see the difference
    const { data: dbSummary } = await supabase.rpc('execute_sql', { query: "SELECT codigo_equipe, COUNT(*) FROM public.tb_comparativo_toolkit GROUP BY 1" });
    
    let excelRows = 0;
    const excelTechs = new Set();
    const differences = [];

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const v = row.values;
            const techID = cleanID(v[2]);
            const itemCode = v[8]?.toString();
            const qty = v[10];
            
            excelTechs.add(techID);
            excelRows++;
            
            // Just sampling the first 10 rows to see if there are differences
            if (differences.length < 5) {
                differences.push({ techID, itemCode, qty });
            }
        }
    });

    console.log(`EXCEL_TECHS_COUNT: ${excelTechs.size}`);
    console.log(`EXCEL_TOTAL_ROWS: ${excelRows}`);
}

crossCheck();
