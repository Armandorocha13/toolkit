const { createClient } = require('@supabase/supabase-js');
const ExcelJS = require('exceljs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Função para remover acentos e caracters especiais
function removeAccents(str) {
    if (typeof str !== 'string') return str;
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

function getFormattedDate(dateStr) {
    if (!dateStr) return 'N/D';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/D';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

async function exportCompleteReport() {
    console.log('--- Iniciando Exportação das 3 Abas COMPLETA (Paginada) ---');
    const workbook = new ExcelJS.Workbook();

    // --- ABA 1: COMPARATIVO INDIVIDUAL ---
    console.log('📈 Coletando Aba 1: Comparativo Individual...');
    const ws1 = workbook.addWorksheet('1. Comparativo Individual');
    ws1.columns = [
        { header: 'Matrícula', key: 'matricula', width: 12 },
        { header: 'Colaborador', key: 'nome', width: 35 },
        { header: 'Contrato', key: 'tipo_toolkit', width: 20 },
        { header: 'Admissão', key: 'admissao', width: 12 },
        { header: 'Filial', key: 'base', width: 20 },
        { header: 'Material', key: 'descricao_item', width: 40 },
        { header: 'Código Material', key: 'codigo_item', width: 15 },
        { header: 'Família', key: 'familia', width: 20 },
        { header: 'Valor Unitário', key: 'preco_unitario', width: 15 },
        { header: 'Qtd Padrão', key: 'quantidade_padrao', width: 12 },
        { header: 'Saldo Real', key: 'saldo_funcionario', width: 12 },
        { header: 'Diferença', key: 'diferenca', width: 12 },
        { header: 'Valor Total Perda', key: 'valor_diferenca', width: 15 }
    ];

    let from1 = 0;
    const step = 1000;
    let hasMore1 = true;
    while (hasMore1) {
        const { data, error } = await supabase
            .from('view_toolkit_aba1_detalhado')
            .select('*')
            .range(from1, from1 + step - 1);
        if (error) { console.error('Erro Aba 1:', error); break; }
        if (!data || data.length === 0) { hasMore1 = false; } else {
            const rows = data.map(r => ({
                ...r,
                nome: removeAccents(r.nome),
                descricao_item: removeAccents(r.descricao_item),
                tipo_toolkit: removeAccents(r.tipo_toolkit),
                base: removeAccents(r.base),
                admissao: getFormattedDate(r.admissao)
            }));
            ws1.addRows(rows);
            from1 += data.length;
            if (data.length < step) hasMore1 = false;
            console.log(`✅ Aba 1: ${from1} registros...`);
        }
    }

    // --- ABA 2: RESUMO DE VAGAS E ORÇAMENTO ---
    console.log('📈 Coletando Aba 2: Resumo de Vagas...');
    const ws2 = workbook.addWorksheet('2. Resumo de Vagas e Orcamento');
    ws2.columns = [
        { header: 'Mês/Ano', key: 'mes', width: 12 },
        { header: 'Base', key: 'base', width: 25 },
        { header: 'Função', key: 'funcao', width: 25 },
        { header: 'Vagas Esperadas', key: 'esperados', width: 18 },
        { header: 'Contratados Real', key: 'entraram', width: 18 },
        { header: 'GAP', key: 'gap', width: 15 },
        { header: 'Custo Efetivo', key: 'orcamento_pago', width: 20 },
        { header: 'Saldo Orçamento', key: 'saldo_orcamento', width: 20 }
    ];

    const { data: budgetData, error: bError } = await supabase
        .from('tb_resultado_vagas_consolidado')
        .select('*');
    if (!bError && budgetData) {
        ws2.addRows(budgetData.map(r => ({...r, gap: r.entraram - r.esperados})));
    }
    console.log(`✅ Aba 2 concluída.`);

    // --- ABA 3: RESUMO POR TÉCNICO ---
    console.log('📈 Coletando Aba 3: Resumo por Técnico...');
    const ws3 = workbook.addWorksheet('3. Resumo por Tecnico');
    ws3.columns = [
        { header: 'Matrícula', key: 'matricula', width: 12 },
        { header: 'Colaborador', key: 'nome', width: 35 },
        { header: 'Admissão', key: 'admissao', width: 15 },
        { header: 'Base', key: 'base', width: 20 },
        { header: 'Estado', key: 'estado', width: 10 },
        { header: 'Função', key: 'funcao', width: 30 },
        { header: 'Demitido?', key: 'status_demitido', width: 15 },
        { header: 'Status Toolkit', key: 'status_toolkit', width: 20 }
    ];

    let from3 = 0;
    let hasMore3 = true;
    while (hasMore3) {
        const { data, error } = await supabase
            .from('view_toolkit_aba3_resumo_tecnico')
            .select('*')
            .range(from3, from3 + step - 1);
        if (error) { console.error('Erro Aba 3:', error); break; }
        if (!data || data.length === 0) { hasMore3 = false; } else {
            ws3.addRows(data.map(r => ({
                ...r,
                nome: removeAccents(r.nome),
                admissao: getFormattedDate(r.admissao)
            })));
            from3 += data.length;
            if (data.length < step) hasMore3 = false;
        }
    }
    console.log(`✅ Aba 3 concluída.`);

    // Estilização Geral
    [ws1, ws2, ws3].forEach(ws => {
        ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203764' } };
    });

    const desktopPath = path.join('c:', 'Users', 'user', 'Desktop', 'RELATORIO_AUDITORIA_FINAL_DEFINITIVO_V7_COM_VALADARES.xlsx');
    await workbook.xlsx.writeFile(desktopPath);
    console.log(`\n✅ SUCESSO! Relatório Completo Gerado em: ${desktopPath}`);
}

exportCompleteReport();
