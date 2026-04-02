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

function getStr(values, idx) {
    if (!idx) return null;
    const v = values[idx];
    return v !== null && v !== undefined ? v.toString().trim() : null;
}

async function importExcel() {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, '../../dados/saldoVolante.xlsx');
    
    console.log(`🚀 Iniciando importação de ${filePath}...`);
    
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        
        // ──────────────────────────────────────────────────
        // PASSO 1: Ler o cabeçalho dinamicamente (linha 1)
        // ──────────────────────────────────────────────────
        let colMap = {};
        worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const header = cell.value ? cell.value.toString().trim().toLowerCase() : null;
            if (header) colMap[header] = colNumber;
        });

        console.log('🗺️ Mapeamento de colunas detectado:', colMap);

        // Mapa normalizado — tolera variações de nomenclatura do arquivo
        const col = {
            cod_supervisor:  colMap['cód. supervisor'] || colMap['cod. supervisor'] || colMap['cod supervisor'],
            supervisor:      colMap['supervisor'],
            equipe:          colMap['equipe'],
            fre:             colMap['nº f.r.e.'] || colMap['nº fre'] || colMap['fre'],
            nome_equipe:     colMap['nome da equipe'] || colMap['nome equipe'],
            conta_cliente:   colMap['conta cliente'],
            cod_material:    colMap['cód. material'] || colMap['cod. material'] || colMap['cod material'],
            desc_material:   colMap['desc. material'] || colMap['descrição material'] || colMap['desc material'],
            desc_auxiliar:   colMap['descrição auxiliar'] || colMap['desc. auxiliar'],
            cod_cpl_aux:     colMap['cód. cpl. aux'] || colMap['cód cpl aux'],
            unidade_medida:  colMap['unidade'],
            cod_compl:       colMap['cód. compl.'] || colMap['cod compl'],
            grupo_material:  colMap['grupo de material'] || colMap['grupo material'],
            recebido:        colMap['recebido'],
            devolucao:       colMap['devolução'] || colMap['devolucao'],
            aplicado:        colMap['aplicado'],
            removido:        colMap['removido'],
            saldo:           colMap['saldo'],
            valor_unitario:  colMap['valor unit.'] || colMap['valor unitário'],
            total:           colMap['total r$'] || colMap['total'],
        };

        // ──────────────────────────────────────────────────
        // PASSO 2: TRUNCATE antes de importar
        // ──────────────────────────────────────────────────
        console.log('🗑️ Limpando tabela saldo_volante antes de importar...');
        const { error: truncErr } = await supabase.rpc('truncate_saldo_volante');
        if (truncErr) {
            console.error('❌ Erro ao truncar:', truncErr.message);
            return;
        }
        console.log('✅ Tabela limpa com sucesso!');

        // ──────────────────────────────────────────────────
        // PASSO 3: Iterar e inserir em batches
        // ──────────────────────────────────────────────────
        let allRecords = [];
        let totalProcessed = 0;

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return; // Pular cabeçalho

            const values = row.values;
            if (!values || values.length < 3) return;

            const equipe = getStr(values, col.equipe);
            const nome_equipe = getStr(values, col.nome_equipe);
            const cod_material = getStr(values, col.cod_material);

            // Ignorar linhas sem dados essenciais
            if (!equipe && !nome_equipe) return;
            if (!cod_material) return;

            allRecords.push({
                cod_supervisor: getStr(values, col.cod_supervisor),
                supervisor:     getStr(values, col.supervisor),
                equipe:         equipe,
                fre:            getStr(values, col.fre),
                nome_equipe:    nome_equipe,
                conta_cliente:  getStr(values, col.conta_cliente),
                cod_material:   cod_material,
                desc_material:  getStr(values, col.desc_material),
                desc_auxiliar:  getStr(values, col.desc_auxiliar),
                cod_cpl_aux:    getStr(values, col.cod_cpl_aux),
                unidade_medida: getStr(values, col.unidade_medida),
                cod_compl:      getStr(values, col.cod_compl),
                grupo_material: getStr(values, col.grupo_material),
                recebido:       cleanNumber(values[col.recebido]),
                devolucao:      cleanNumber(values[col.devolucao]),
                aplicado:       cleanNumber(values[col.aplicado]),
                removido:       cleanNumber(values[col.removido]),
                saldo:          cleanNumber(values[col.saldo]),
                valor_unit:     cleanNumber(values[col.valor_unitario]),
                total_rs:       cleanNumber(values[col.total]),
            });

            totalProcessed++;
        });

        console.log(`📦 ${allRecords.length} registros lidos. Iniciando inserção em batches...`);

        let totalInserted = 0;
        for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
            const batch = allRecords.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('saldo_volante').insert(batch);
            if (error) {
                console.error(`❌ Erro no batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
            } else {
                totalInserted += batch.length;
                process.stdout.write(`\r✅ Inseridos: ${totalInserted}/${allRecords.length}`);
            }
        }

        console.log(`\n\n✨ Importação concluída! Total inserido: ${totalInserted} registros.`);

    } catch (err) {
        console.error('❌ Erro crítico na importação:', err.message);
    }
}

importExcel().catch(console.error);
