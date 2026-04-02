const { createClient } = require('@supabase/supabase-js');
const ExcelJS = require('exceljs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function exportCompleto() {
    console.log('--- Iniciando Exportação COMPLETA (Paginada) ---');
    
    let allData = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('view_comparativo_toolkit')
            .select('*')
            .range(from, from + step - 1);

        if (error) {
            console.error('Erro ao buscar dados:', error);
            break;
        }

        if (!data || data.length === 0) {
            hasMore = false;
        } else {
            allData = allData.concat(data);
            console.log(`✅ Lote lido: ${allData.length} registros totais...`);
            from += data.length;
            if (data.length < step) hasMore = false;
        }
    }

    console.log(`Total de dados consolidados: ${allData.length} linhas.`);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Auditoria 57 Tecnicos');

    worksheet.columns = [
        { header: 'Código Equipe', key: 'codigo_equipe', width: 15 },
        { header: 'Colaborador', key: 'nome_colaborador', width: 35 },
        { header: 'Contrato', key: 'contrato', width: 20 },
        { header: 'Admissão', key: 'admissao', width: 15 },
        { header: 'Filial', key: 'filial', width: 20 },
        { header: 'Descrição do Item', key: 'descricao_item', width: 40 },
        { header: 'Código do Item', key: 'codigo_item', width: 15 },
        { header: 'Família', key: 'familia', width: 20 },
        { header: 'Quantidade Padrão', key: 'quantidade', width: 15 },
        { header: 'Saldo Atual WMS', key: 'saldo', width: 15 },
        { header: 'Diferença', key: 'diferenca', width: 12 },
        { header: 'Valor Perda (RS)', key: 'valor', width: 15 }
    ];

    worksheet.addRows(allData);

    // Estilização
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF203764' }
    };

    // Caminho da Área de Trabalho
    const desktopPath = path.join('c:', 'Users', 'user', 'Desktop', 'AUDITORIA_TOOLKIT_SP_COMPLETA.xlsx');

    try {
        await workbook.xlsx.writeFile(desktopPath);
        console.log(`\n=================================================`);
        console.log(`✅ SUCESSO! Planilha Completa Gerada com ${allData.length} linhas.`);
        console.log(`📍 Local: ${desktopPath}`);
        console.log(`=================================================`);
    } catch (err) {
        console.error('Erro ao salvar arquivo:', err);
    }
}

exportCompleto();
