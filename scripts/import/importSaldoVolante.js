const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Configurações (Preenchidas automaticamente pelo Agent)
const SUPABASE_URL = 'https://dldvrpiwdenxpknquvpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wXrXxklY847tvHXdnY9RkA_aysrKB3X'; // Use a chave default publishable
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
    const filePath = path.join(__dirname, '../../dados/saldoVolante.xlsx');
    
    console.log(`🚀 Iniciando importação de ${filePath}...`);
    
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        
        let batch = [];
        let totalProcessed = 0;
        let totalInserted = 0;

        worksheet.eachRow({ includeEmpty: true }, async function(row, rowNumber) {
            // Pular as 5 primeiras linhas (Header está na 5, dados começam na 6)
            if (rowNumber <= 5) return;

            const values = row.values;
            if (!values || values.length < 2) return; // Linha vazia

            const record = {
                contrato: values[1] ? values[1].toString() : null,
                projeto: values[2] ? values[2].toString() : null,
                cod_supervisor: values[3] ? values[3].toString() : null,
                supervisor: values[4] ? values[4].toString() : null,
                equipe: values[5] ? values[5].toString() : null,
                fre: values[6] ? values[6].toString() : null,
                nome_equipe: values[7] ? values[7].toString() : null,
                conta_cliente: values[8] ? values[8].toString() : null,
                cod_material: values[9] ? values[9].toString() : null,
                desc_material: values[10] ? values[10].toString() : null,
                desc_auxiliar: values[11] ? values[11].toString() : null,
                cod_cpl_aux: values[12] ? values[12].toString() : null,
                unidade_medida: values[13] ? values[13].toString() : null,
                cod_compl: values[14] ? values[14].toString() : null,
                grupo_material: values[15] ? values[15].toString() : null,
                recebido: cleanNumber(values[16]),
                devolucao: cleanNumber(values[17]),
                aplicado: cleanNumber(values[18]),
                removido: cleanNumber(values[19]),
                saldo: cleanNumber(values[20]),
                valor_unit: cleanNumber(values[21]),
                total_rs: cleanNumber(values[22])
            };

            batch.push(record);
            totalProcessed++;

            if (batch.length >= BATCH_SIZE) {
                // Como eachRow é síncrono por padrão mas o processamento é async, 
                // precisamos pausar ou controlar o fluxo se for muito grande.
                // Usaremos um array de promessas para os batches.
            }
        });

        // Refactoring to handle batches properly since eachRow is not natively async
        console.log(`🔍 Total de linhas encontradas para importar: ${totalProcessed}`);
        
        const allRecords = [];
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber > 5) {
                const values = row.values;
                if (values && values.length > 5) {
                    allRecords.push({
                        contrato: values[1] ? values[1].toString() : null,
                        projeto: values[2] ? values[2].toString() : null,
                        cod_supervisor: values[3] ? values[3].toString() : null,
                        supervisor: values[4] ? values[4].toString() : null,
                        equipe: values[5] ? values[5].toString() : null,
                        fre: values[6] ? values[6].toString() : null,
                        nome_equipe: values[7] ? values[7].toString() : null,
                        conta_cliente: values[8] ? values[8].toString() : null,
                        cod_material: values[9] ? values[9].toString() : null,
                        desc_material: values[10] ? values[10].toString() : null,
                        desc_auxiliar: values[11] ? values[11].toString() : null,
                        cod_cpl_aux: values[12] ? values[12].toString() : null,
                        unidade_medida: values[13] ? values[13].toString() : null,
                        cod_compl: values[14] ? values[14].toString() : null,
                        grupo_material: values[15] ? values[15].toString() : null,
                        recebido: cleanNumber(values[16]),
                        devolucao: cleanNumber(values[17]),
                        aplicado: cleanNumber(values[18]),
                        removido: cleanNumber(values[19]),
                        saldo: cleanNumber(values[20]),
                        valor_unit: cleanNumber(values[21]),
                        total_rs: cleanNumber(values[22])
                    });
                }
            }
        });

        console.log(`📦 Carregado em memória. Limpando base atual para substituição...`);
        
        // Truncar a tabela saldo_volante usando nossa função nativa RPC no banco de dados para evitar timeout e problemas de exclusão em massa.
        const { error: deleteError } = await supabase.rpc('truncate_saldo_volante');
        
        if (deleteError) {
            console.error("❌ Falha crítica ao tentar truncar/limpar a tabela saldo_volante:", deleteError.message);
        } else {
            console.log("🧹 Tabela saldo_volante limpa com sucesso. Iniciando upload dos novos dados...");
        }

        for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
            const currentBatch = allRecords.slice(i, i + BATCH_SIZE);
            const { error } = await supabase
                .from('saldo_volante')
                .insert(currentBatch);
            
            if (error) {
                console.error(`❌ Erro no batch ${i/BATCH_SIZE + 1}:`, error.message);
            } else {
                totalInserted += currentBatch.length;
                process.stdout.write(`✅ Batch ${Math.floor(i/BATCH_SIZE) + 1} enviado (${totalInserted}/${allRecords.length})\n`);
            }
        }

        console.log(`\n\n✨ Importação de Saldo concluída! Total inserido: ${totalInserted}`);

    } catch (error) {
        console.error('💥 Erro fatal na importação:', error);
    }
}

importExcel();
