const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const os = require('os');

const SUPABASE_URL = 'https://dldvrpiwdenxpknquvpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wXrXxklY847tvHXdnY9RkA_aysrKB3X';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function removeAccents(str) {
    if (typeof str !== 'string') return str;
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

function getMesAno(dateStr) {
    if (!dateStr) return 'N/D';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/D';
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    return `${meses[date.getMonth()]}/${date.getFullYear()}`;
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

async function exportCompleteReport(targetMonth = '03/2026') {
    const [monthPart, yearPart] = targetMonth.split('/');
    const startDate = `${yearPart}-${monthPart}-01`;
    const endDate = `${yearPart}-${monthPart}-31`; // Simplificado para auditoria

    console.log(`📥 Iniciando exportação completa para ${targetMonth}...`);

    console.log(`✅ Preparando auditoria para ${targetMonth}...`);

    // 1. EXTRAÇÃO DOS DADOS DETALHADOS (ABA 1)
    let detailedRecords = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('view_toolkit_aba1_detalhado')
            .select('*')
            .order('nome', { ascending: true })
            .range(from, from + step - 1);

        if (error) {
            console.error("Erro na paginação de detalhados:", error);
            break;
        }
        if (!data || data.length === 0) {
            hasMore = false;
        } else {
            detailedRecords = detailedRecords.concat(data);
            from += data.length;
            if (data.length < step) hasMore = false;
        }
    }
    console.log(`✅ Coletados ${detailedRecords.length} registros detalhados.`);

    // 2. EXTRAÇÃO DOS DADOS DOS TÉCNICOS (Para Estado e Função Real)
    const { data: techDetails } = await supabase
        .from('contratado_2026')
        .select('funcionario, uf_empresa, funcao');

    const techMap = {};
    if (techDetails) {
        techDetails.forEach(t => {
            techMap[t.funcionario] = {
                estado: t.uf_empresa || 'N/D',
                funcao: t.funcao || 'N/D'
            };
        });
    }

    // 3. EXTRAÇÃO DO RESUMO DE VAGAS/ORÇAMENTO (ABA 2)
    const { data: budgetRecords, error: bError } = await supabase
        .from('tb_resultado_vagas_consolidado')
        .select('*')
        .eq('mes', targetMonth)
        .order('mes', { ascending: false });

    if (bError) console.error("Erro ao buscar resumo de vagas:", bError);

    // 4. PREÇOS DOS MATERIAIS
    const { data: precos } = await supabase.from('apoio_materiais_familia').select('codigo, valor');
    const precosMap = {};
    if (precos) precos.forEach(p => precosMap[String(p.codigo).replace(/^0+/, '')] = p.valor);

    const workbook = new ExcelJS.Workbook();

    // --- ABA 1: COMPARATIVO INDIVIDUAL ---
    const ws1 = workbook.addWorksheet('1. Comparativo Individual');
    ws1.columns = [
        { header: 'Cod Equipe', key: 'matricula', width: 12 },
        { header: 'Colaborador', key: 'nome', width: 35 },
        { header: 'Contrato', key: 'tipo_toolkit', width: 20 },
        { header: 'Admissão', key: 'admissao', width: 12 },
        { header: 'Filial', key: 'base', width: 20 },
        { header: 'Material', key: 'descricao_item', width: 40 },
        { header: 'Código Material', key: 'codigo_item', width: 15 },
        { header: 'Família', key: 'familia', width: 20 },
        { header: 'Valor Unitário', key: 'preco_unitario', width: 15, style: { numFmt: '"R$ "#,##0.00' } },
        { header: 'Qtd Padrão', key: 'quantidade_padrao', width: 12 },
        { header: 'Saldo Real', key: 'saldo_funcionario', width: 12 },
        { header: 'Diferença', key: 'diferenca', width: 12 },
        { header: 'Valor Total Perda', key: 'valor_diferenca', width: 15, style: { numFmt: '"R$ "#,##0.00' } }
    ];

    const rows1 = detailedRecords.map(r => ({
        ...r,
        nome: removeAccents(r.nome),
        descricao_item: removeAccents(r.descricao_item),
        tipo_toolkit: removeAccents(r.tipo_toolkit),
        base: removeAccents(r.base),
        familia: removeAccents(r.familia)
    }));
    ws1.addRows(rows1);

    // --- ABA 2: RESUMO DE VAGAS E ORÇAMENTO ---
    const ws2 = workbook.addWorksheet('2. Resumo de Vagas e Orcamento');
    ws2.columns = [
        { header: 'Mês/Ano', key: 'mes', width: 12 },
        { header: 'Base (Cidade/Cluster)', key: 'base', width: 25 },
        { header: 'Estado', key: 'estado', width: 10 },
        { header: 'Função do Toolkit', key: 'funcao', width: 25 },
        { header: 'Vagas Esperadas (A)', key: 'esperados', width: 18 },
        { header: 'Contratados Real (B)', key: 'entraram', width: 18 },
        { header: 'GAP Contratação (B-A)', key: 'gap', width: 18 },
        { header: 'Techs c/ Excesso de Carga', key: 'paguei_a_mais_tecnicos', width: 22 },
        { header: 'Techs c/ Itens Faltantes', key: 'receberam_listagem_faltante', width: 22 },
        { header: 'Orçamento Previsto', key: 'orcamento_previsto', width: 22, style: { numFmt: '"R$ "#,##0.00' } },
        { header: 'Custo Efetivo', key: 'orcamento_pago', width: 22, style: { numFmt: '"R$ "#,##0.00' } },
        { header: 'Saldo Orçamento', key: 'saldo_orcamento', width: 25, style: { numFmt: '"R$ "#,##0.00' } }
    ];

    const rows2 = (budgetRecords || []).map(r => ({
        ...r,
        base: removeAccents(r.base),
        funcao: removeAccents(r.funcao),
        gap: r.entraram - r.esperados
    }));
    ws2.addRows(rows2);

    // --- ABA 3: RESUMO POR TÉCNICO ---
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

    const { data: aba3Data, error: aba3Error } = await supabase
        .from('view_toolkit_aba3_resumo_tecnico')
        .select('*');

    if (aba3Error) console.error("Erro ao buscar resumo aba 3:", aba3Error);

    const rows3 = (aba3Data || []).map(r => ({
        ...r,
        nome: removeAccents(r.nome),
        base: removeAccents(r.base),
        funcao: removeAccents(r.funcao),
        admissao: getFormattedDate(r.admissao)
    }));
    ws3.addRows(rows3);

    // --- ESTILIZAÇÃO E SALVAMENTO ---
    [ws1, ws2, ws3].forEach(ws => {
        ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };
        ws.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
        ws.getRow(1).alignment = { horizontal: 'center' };
    });

    // Colorir células de "SIM" em inativos para destaque (Opcional, mas legal)
    ws3.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const cellVal = row.getCell('G').value; // Coluna G: Demitido RH?
            if (cellVal === 'SIM') {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' } }; // Rosa claro para inativos
                });
            }
        }
    });

    const filePath = path.join(__dirname, '../../dados/CONTROLE DE TOOLKIT.xlsx');
    
    try {
        await workbook.xlsx.writeFile(filePath);
        console.log(`✨ RELATÓRIO CONSOLIDADO ATUALIZADO COM SUCESSO!`);
        console.log(`📍 Salvo na pasta local do projeto: ${filePath}`);
    } catch (writeErr) {
        console.error(`❌ Erro ao salvar arquivo. Verifique se o Excel está aberto:`, writeErr.message);
    }
}

const argMonth = process.argv[2] && process.argv[2].includes('/') ? process.argv[2] : '03/2026';
exportCompleteReport(argMonth).catch(console.error);
