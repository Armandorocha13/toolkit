const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dldvrpiwdenxpknquvpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wXrXxklY847tvHXdnY9RkA_aysrKB3X';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function cleanID(id) {
    if (!id) return null;
    return id.toString().trim().padStart(6, '0');
}

async function fastImport() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('dados/view.xlsx');
    const worksheet = workbook.getWorksheet(1);
    
    let allRecords = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const v = row.values;
            allRecords.push({
                codigo_equipe:   cleanID(v[1]),
                nome_colaborador: v[2] ? v[2].toString().trim().toUpperCase() : null,
                contrato:         v[3] ? v[3].toString().toUpperCase() : null,
                admissao:         v[4],
                filial:           v[5],
                descricao_item:   v[6],
                codigo_item:     v[7] ? v[7].toString() : null,
                familia:          v[8],
                quantidade:       v[9] ? parseInt(v[9]) : 0,
                saldo:            v[10] ? parseInt(v[10]) : 0,
                diferenca:        v[11] ? parseInt(v[11]) : 0,
                valor:            v[12] ? parseFloat(v[12]) : 0
            });
        }
    });

    console.log(`🚀 Carregado ${allRecords.length} registros para envio em batches...`);
    const BATCH_SIZE = 1000;
    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
        const batch = allRecords.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('tb_comparativo_toolkit').insert(batch);
        if (error) console.error(`❌ Erro no batch ${i}:`, error.message);
        else console.log(`✅ Batch ${Math.floor(i/BATCH_SIZE) + 1} enviado.`);
    }
}

fastImport();
