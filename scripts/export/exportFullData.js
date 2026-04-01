const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dldvrpiwdenxpknquvpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wXrXxklY847tvHXdnY9RkA_aysrKB3X';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para remover acentos e caracters especiais
function removeAccents(str) {
    if (typeof str !== 'string') return str;
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

async function exportFullDatasetClean() {
    let allRecords = [];
    let from = 0;
    const step = 800;
    let hasMore = true;

    console.log("📥 Iniciando exportação MASSIVA (Sem Acentos/Limpeza de Texto)...");

    while (hasMore) {
        const { data, error } = await supabase
            .from('tb_comparativo_toolkit')
            .select('*')
            .order('nome_colaborador', { ascending: true })
            .order('codigo_item', { ascending: true })
            .range(from, from + step - 1);

        if (error) break;
        if (!data || data.length === 0) {
            hasMore = false;
        } else {
            allRecords = allRecords.concat(data);
             console.log(`✅ Coletados: ${allRecords.length} registros...`);
            from += data.length;
            if (data.length < step) hasMore = false;
        }
    }

    const { data: precos } = await supabase
        .from('apoio_materiais_familia')
        .select('codigo, valor');
        
    const precosMap = {};
    if (precos) {
        precos.forEach(p => {
            // Normalizar o código removendo zeros à esquerda para garantir o match
            const normalizedCode = String(p.codigo).replace(/^0+/, '');
            precosMap[normalizedCode] = p.valor;
        });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório Limpo');

    worksheet.columns = [
        { header: 'Cod Equipe', key: 'codigo_equipe' },
        { header: 'Colaborador', key: 'nome_colaborador' },
        { header: 'Contrato', key: 'contrato' },
        { header: 'Admissão', key: 'admissao' },
        { header: 'Filial', key: 'filial' },
        { header: 'Material', key: 'descricao_item' },
        { header: 'Código Material', key: 'codigo_item' },
        { header: 'Família', key: 'familia' },
        { header: 'Valor Unitário', key: 'unitario' },
        { header: 'Qtd Padrão', key: 'quantidade' },
        { header: 'Saldo Real', key: 'saldo' },
        { header: 'Diferença', key: 'diferenca' },
        { header: 'Valor Total Perda', key: 'valor' }
    ];

    const finalizedRows = allRecords.map(r => {
        const normalizedItemCode = String(r.codigo_item).replace(/^0+/, '');
        const unitPrice = parseFloat(precosMap[normalizedItemCode]) || 0;
        
        return {
            ...r,
            codigo_equipe: removeAccents(r.codigo_equipe),
            nome_colaborador: removeAccents(r.nome_colaborador),
            contrato: removeAccents(r.contrato),
            filial: removeAccents(r.filial),
            descricao_item: removeAccents(r.descricao_item),
            familia: removeAccents(r.familia),
            unitario: unitPrice,
            valor: (r.diferenca * unitPrice)
        };
    });

    worksheet.addRows(finalizedRows);
    worksheet.getRow(1).font = { bold: true };

    const filePath = 'c:\\Users\\user\\Desktop\\ARQUVOS\\PPROJETOS PROGRAMAÇÃO\\Listagem Toolkit\\dados\\view_consolidada_final_ajustada_math.xlsx';
    await workbook.xlsx.writeFile(filePath);
    console.log(`✅ EXPORTAÇÃO (VERSÃO LIMPA SEM ACENTOS) CONCLUÍDA!`);
    console.log(`📊 TOTAL DE LINHAS: ${finalizedRows.length}`);
}

exportFullDatasetClean();
