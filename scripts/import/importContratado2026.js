const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const SUPABASE_URL = 'https://dldvrpiwdenxpknquvpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wXrXxklY847tvHXdnY9RkA_aysrKB3X';
const BATCH_SIZE = 1000;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseDate(val) {
    if (!val) return null;
    if (val instanceof Date) return val.toISOString().split('T')[0];
    if (typeof val === 'string' && val.trim() !== '') {
        const d = new Date(val);
        return isNaN(d) ? null : d.toISOString().split('T')[0];
    }
    return null;
}

async function importExcel() {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, '../../dados/CONTRATADO 2026 GERAL FFA.xlsx');

    console.log(`🚀 Iniciando importação de ${filePath}...`);

    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    const allRecords = [];

    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Pular cabeçalho

        const values = row.values;
        if (!values || values.length < 2) return;

        allRecords.push({
            empresa:          values[1] ? values[1].toString().trim() : null,
            cidade_empresa:   values[2] ? values[2].toString().trim() : null,
            uf_empresa:       values[3] ? values[3].toString().trim() : null,
            nome_empresa:     values[4] ? values[4].toString().trim() : null,
            funcionario:      values[5] ? values[5].toString().trim() : null,
            nome_funcionario: values[6] ? values[6].toString().trim() : null,
            funcao:           values[7] ? values[7].toString().trim() : null,
            departamento:     values[8] ? values[8].toString().trim() : null,
            status:           values[9] ? values[9].toString().trim() : null,
            admissao:         parseDate(values[10]),
            cpf:              values[11] ? values[11].toString().trim() : null,
            status_almox:     values[12] ? values[12].toString().trim() : null,
            status_operacao:  values[13] ? values[13].toString().trim() : null,
        });
    });

    console.log(`📦 ${allRecords.length} registros carregados. Enviando...`);

    let totalInserted = 0;
    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
        const batch = allRecords.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('contratado_2026').insert(batch);

        if (error) {
            console.error(`❌ Erro no batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
        } else {
            totalInserted += batch.length;
            console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} enviado (${totalInserted}/${allRecords.length})`);
        }
    }

    console.log(`\n✨ Importação concluída! Total inserido: ${totalInserted}`);
}

importExcel().catch(console.error);
