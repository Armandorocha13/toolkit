const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const SUPABASE_URL = 'https://dldvrpiwdenxpknquvpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wXrXxklY847tvHXdnY9RkA_aysrKB3X';
const BATCH_SIZE = 1000;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function cleanNumber(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    let str = val.toString().replace(/\./g, '').replace(',', '.');
    let num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

async function importExcel() {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, '../../dados/listagemToolkit.xlsx');
    
    console.log(`🚀 Iniciando importação de ${filePath}...`);
    
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        
        const allRecords = [];
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber <= 1) return; // Pular cabeçalho
            
            const values = row.values;
            if (!values || values.length < 2) return;
            
            allRecords.push({
                contrato:   values[1] ? values[1].toString().trim() : null,
                descricao:  values[2] ? values[2].toString().trim() : null,
                codigo:     values[3] ? values[3].toString().trim() : null,
                familia:    values[4] ? values[4].toString().trim() : null,
                quantidade: cleanNumber(values[5]),
                extra:      values[6] ? values[6].toString().trim() : null
            });
        });
        
        console.log(`📦 ${allRecords.length} registros carregados. Enviando...`);
        
        let totalInserted = 0;
        for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
            const batch = allRecords.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('listagem_toolkit').insert(batch);
            
            if (error) {
                console.error(`❌ Erro no batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
            } else {
                totalInserted += batch.length;
                console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} enviado (${totalInserted}/${allRecords.length})`);
            }
        }
        
        console.log(`\n✨ Importação concluída! Total inserido: ${totalInserted}`);
        
    } catch (error) {
        console.error('💥 Erro fatal na importação:', error);
    }
}

importExcel().catch(console.error);
