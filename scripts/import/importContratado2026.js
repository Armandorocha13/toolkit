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

async function importExcel(snapshotMes = '03/2026') {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, '../../dados/CONTRATADO 2026 GERAL FFA.xlsx');

    console.log(`🚀 Iniciando importação de ${filePath} para o mês ${snapshotMes}...`);

    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    const allRecords = [];
    let colMap = {};

    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber === 1) {
            row.values.forEach((val, index) => {
                if (val && typeof val === 'string') {
                    colMap[val.trim().toLowerCase()] = index;
                }
            });
            return;
        }

        const values = row.values;
        if (!values || values.length < 2) return;

        const getRaw = (colName) => {
            const idx = colMap[colName];
            return idx ? values[idx] : null;
        };
        const getStr = (colName) => {
            const val = getRaw(colName);
            return val ? val.toString().trim() : null;
        };

        allRecords.push({
            empresa:          getStr('empresa'),
            cidade_empresa:   getStr('cidade_empresa'),
            uf_empresa:       getStr('uf_empresa'),
            nome_empresa:     getStr('nome_empresa'),
            funcionario:      getStr('funcionario'),
            nome_funcionario: getStr('nome_funcionario'),
            funcao:           getStr('funcao'),
            departamento:     getStr('departamento'),
            status:           getStr('status'),
            admissao:         parseDate(getRaw('admissao')),
            cpf:              getStr('cpf'),
            status_almox:     getStr('status_almox'),
            status_operacao:  getStr('status_operacao')
        });
    });

    console.log(`📦 ${allRecords.length} registros identificados. Esvaziando base antiga...`);
    
    // TRUNCATE: Limpa a tabela integralmente antes de puxar, previnindo "técnicos fantasmas"
    const { error: truncateErr } = await supabase.rpc('truncate_contratado');
    if (truncateErr) {
        console.error("❌ Falha crítica ao tentar limpar a tabela Contratados:", truncateErr);
    }

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

const argMonth = process.argv[2] && process.argv[2].includes('/') ? process.argv[2] : '03/2026';
importExcel(argMonth).catch(console.error);
