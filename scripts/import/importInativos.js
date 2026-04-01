const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const SUPABASE_URL = 'https://dldvrpiwdenxpknquvpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wXrXxklY847tvHXdnY9RkA_aysrKB3X';
const BATCH_SIZE = 1000;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importExcel(snapshotMes = '03/2026') {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, '../../dados/listagemFuncionariosInativos.xlsx');

    console.log(`🚀 Iniciando importação de Inativos (${filePath}) para o mês ${snapshotMes}...`);

    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);

        const allRecords = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Header

            const values = row.values;
            if (!values || values.length < 1) return;

            allRecords.push({
                matricula: values[1] ? values[1].toString().trim() : null,
                nome: values[2] ? values[2].toString().trim() : null,
                data_admissao: values[3] ? values[3].toString().trim() : null,
                data_demissao: values[4] ? values[4].toString().trim() : null,
                data_nascimento: values[5] ? values[5].toString().trim() : null,
                cpf: values[6] ? values[6].toString().trim() : null,
                centro_de_custo: values[7] ? values[7].toString().trim() : null,
                snapshot_mes: snapshotMes
            });
        });

        console.log(`📦 ${allRecords.length} inativos carregados. Limpando histórico para ${snapshotMes}...`);
        
        await supabase.from('lista_inativos').delete().eq('snapshot_mes', snapshotMes);

        let totalInserted = 0;
        for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
            const batch = allRecords.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('lista_inativos').insert(batch);
            if (error) {
                console.error(`❌ Erro no batch:`, error.message);
            } else {
                totalInserted += batch.length;
                console.log(`✅ Progress: ${totalInserted}/${allRecords.length}`);
            }
        }

        console.log(`✨ Importação de Inativos finalizada! Total: ${totalInserted}`);
    } catch (e) {
        console.error("💥 Falha na importação de inativos:", e.message);
    }
}

const argMonth = process.argv[2] && process.argv[2].includes('/') ? process.argv[2] : '03/2026';
importExcel(argMonth).catch(console.error);
