const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dldvrpiwdenxpknquvpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wXrXxklY847tvHXdnY9RkA_aysrKB3X';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function removeAccents(str) {
    if (typeof str !== 'string') return str;
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

async function exportCompleteReport() {
    console.log("📥 Iniciando exportação completa em duas abas...");

    // 1. EXTRAÇÃO DOS DADOS DETALHADOS (ABA 1)
    let detailedRecords = [];
    let from = 0;
    const step = 800;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('tb_comparativo_toolkit')
            .select('*')
            .order('nome_colaborador', { ascending: true })
            .range(from, from + step - 1);

        if (error) break;
        if (!data || data.length === 0) {
            hasMore = false;
        } else {
            detailedRecords = detailedRecords.concat(data);
            from += data.length;
            if (data.length < step) hasMore = false;
        }
    }
    console.log(`✅ Coletados ${detailedRecords.length} registros detalhados.`);

    // 2. EXTRAÇÃO DO RESUMO DE VAGAS/ORÇAMENTO (ABA 2)
    const { data: budgetRecords, error: bError } = await supabase
        .from('tb_resultado_vagas_consolidado')
        .select('*')
        .order('mes', { ascending: false });

    if (bError) console.error("Erro ao buscar resumo de vagas:", bError);
    console.log(`✅ Coletados ${budgetRecords ? budgetRecords.length : 0} registros de orçamento.`);

    // Preços para a aba 1
    const { data: precos } = await supabase.from('apoio_materiais_familia').select('codigo, valor');
    const precosMap = {};
    if (precos) precos.forEach(p => precosMap[String(p.codigo).replace(/^0+/, '')] = p.valor);

    const workbook = new ExcelJS.Workbook();

    // ABA 1: COMPARATIVO INDIVIDUAL
    const ws1 = workbook.addWorksheet('1. Comparativo Individual');
    ws1.columns = [
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

    const rows1 = detailedRecords.map(r => {
        const normCode = String(r.codigo_item).replace(/^0+/, '');
        const price = parseFloat(precosMap[normCode]) || 0;
        return {
            ...r,
            nome_colaborador: removeAccents(r.nome_colaborador),
            descricao_item: removeAccents(r.descricao_item),
            contrato: removeAccents(r.contrato),
            filial: removeAccents(r.filial),
            familia: removeAccents(r.familia),
            unitario: price,
            valor: r.diferenca > 0 ? (r.diferenca * price) : 0
        };
    });
    ws1.addRows(rows1);
    ws1.getRow(1).font = { bold: true };

    // ABA 2: RESUMO DE VAGAS E ORÇAMENTO
    const ws2 = workbook.addWorksheet('2. Resumo de Vagas e Orcamento');
    ws2.columns = [
        { header: 'Mês/Ano', key: 'mes' },
        { header: 'Base (Cidade/Cluster)', key: 'base' },
        { header: 'Estado', key: 'estado' },
        { header: 'Função do Toolkit', key: 'funcao' },
        { header: 'Vagas Esperadas (A)', key: 'esperados' },
        { header: 'Contratados Real (B)', key: 'entraram' },
        { header: 'GAP Contratação (B-A)', key: 'gap' },
        { header: 'Techs c/ Excesso de Carga', key: 'paguei_a_mais_tecnicos' },
        { header: 'Techs c/ Itens Faltantes', key: 'receberam_listagem_faltante' },
        { header: 'Orçamento Previsto (R$)', key: 'orcamento_previsto' },
        { header: 'Custo de Entrega Efetuado (R$)', key: 'orcamento_pago' },
        { header: 'Saldo Orçamento (Economia/Estouro)', key: 'saldo_orcamento' }
    ];

    const rows2 = (budgetRecords || []).map(r => ({
        ...r,
        base: removeAccents(r.base),
        funcao: removeAccents(r.funcao),
        gap: r.entraram - r.esperados
    }));
    ws2.addRows(rows2);
    ws2.getRow(1).font = { bold: true };

    // ESTILIZAÇÃO RÁPIDA (OPCIONAL)
    [ws1, ws2].forEach(ws => {
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };
      ws.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    const filePath = 'c:\\Users\\user\\Desktop\\ARQUVOS\\PPROJETOS PROGRAMAÇÃO\\Listagem Toolkit\\dados\\RELATORIO_REVISADO_V3.xlsx';
    await workbook.xlsx.writeFile(filePath);
    console.log(`✨ RELATÓRIO FINAL CONSOLIDADO GERADO COM SUCESSO!`);
    console.log(`📍 Caminho: ${filePath}`);
}

exportCompleteReport().catch(console.error);
