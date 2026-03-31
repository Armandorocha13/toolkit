const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Configurações
const SUPABASE_URL = 'https://dldvrpiwdenxpknquvpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wXrXxklY847tvHXdnY9RkA_aysrKB3X';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getCellValue(cell) {
    if (cell && typeof cell === 'object' && cell.result !== undefined) {
        return cell.result;
    }
    return cell;
}

async function importExcel() {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, '../../dados/apoioFuncao.xlsx');
    
    console.log(`🚀 Iniciando importação de ${filePath}...`);
    
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        
        const allRecords = [];
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            // Pular header (linha 1)
            if (rowNumber > 1) {
                const values = row.values;
                if (values && values.length >= 2) {
                    allRecords.push({
                        funcao:          values[1] ? values[1].toString().trim() : null,
                        departamento:    values[2] ? values[2].toString().trim() : null,
                        coluna1:         getCellValue(values[3]) ? getCellValue(values[3]).toString().trim() : null,
                        funcao_simples:  values[4] ? values[4].toString().trim() : null,
                    });
                }
            }
        });

        console.log(`📦 ${allRecords.length} registros carregados. Enviando para Supabase...`);

        // Deletar dados existentes
        await supabase.from('apoio_funcao').delete().neq('id', 0);

        const { data, error } = await supabase
            .from('apoio_funcao')
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
