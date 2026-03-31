const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Configurações
const SUPABASE_URL = 'https://dldvrpiwdenxpknquvpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wXrXxklY847tvHXdnY9RkA_aysrKB3X';
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
    const filePath = path.join(__dirname, '../../dados/listaApoioMateriaisPorFamilia.xlsx');
    
    console.log(`🚀 Iniciando importação de ${filePath}...`);
    
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        
        const allRecords = [];
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            // Pular header (linha 1)
            if (rowNumber > 1) {
                const values = row.values;
                // ExcelJS: values[1]=A, values[2]=B, values[3]=C, values[4]=D
                if (values && values.length >= 2) {
                    allRecords.push({
                        nome:    values[1] ? values[1].toString().trim() : null,
                        codigo:  values[2] ? values[2].toString().trim() : null,
                        familia: values[3] ? values[3].toString().trim() : null,
                        valor:   cleanNumber(values[4]),
                    });
                }
            }
        });

        console.log(`📦 ${allRecords.length} registros carregados. Enviando para Supabase...`);

        // Limpar tabela antes de importar para evitar duplicidade
        const { error: truncateError } = await supabase.rpc('execute_sql', { query: 'TRUNCATE TABLE public.apoio_materiais_familia' });
        // Se o RPC não existir, usamos delete normal
        if (truncateError) {
             await supabase.from('apoio_materiais_familia').delete().neq('id', 0);
        }

        const { data, error } = await supabase
            .from('apoio_materiais_familia')
            .insert(allRecords);

        if (error) {
            console.error('❌ Erro na inserção:', error.message);
        } else {
            console.log(`✨ Importação concluída com sucesso! Total: ${allRecords.length}`);
        }

    } catch (error) {
        console.error('💥 Erro fatal:', error);
    }
}

importExcel();
