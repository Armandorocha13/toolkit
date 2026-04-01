const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

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

async function exportCompleteReport() {
    console.log("📥 Iniciando exportação completa em três abas...");

    // 0. CARREGAR LISTAGEM DE INATIVOS
    const inativosSet = new Set();
    const inativosPath = path.join(__dirname, '../../dados/listagemFuncionariosInativos.xlsx');
    try {
        const wbInativos = new ExcelJS.Workbook();
        await wbInativos.xlsx.readFile(inativosPath);
        const wsInativos = wbInativos.getWorksheet(1);
        wsInativos.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const matricula = row.values[1];
                if (matricula) {
                    // Normalizar matrícula para casar (ex: 002140 == 2140)
                    inativosSet.add(String(matricula).trim().replace(/^0+/, ''));
                }
            }
        });
        console.log(`✅ Carregados ${inativosSet.size} funcionários inativos do Excel.`);
    } catch (e) {
        console.error("⚠️ Aviso: Não foi possível carregar listagem de inativos:", e.message);
    }

    // 1. EXTRAÇÃO DOS DADOS DETALHADOS (ABA 1)
    let detailedRecords = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('view_comparativo_toolkit')
            .select('*')
            .gte('admissao', '2026-03-01')
            .lte('admissao', '2026-03-31')
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
        .eq('mes', '03/2026')
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
        { header: 'Cod Equipe', key: 'codigo_equipe', width: 12 },
        { header: 'Colaborador', key: 'nome_colaborador', width: 35 },
        { header: 'Contrato', key: 'contrato', width: 20 },
        { header: 'Admissão', key: 'admissao', width: 12 },
        { header: 'Filial', key: 'filial', width: 20 },
        { header: 'Material', key: 'descricao_item', width: 40 },
        { header: 'Código Material', key: 'codigo_item', width: 15 },
        { header: 'Família', key: 'familia', width: 20 },
        { header: 'Valor Unitário', key: 'unitario', width: 15 },
        { header: 'Qtd Padrão', key: 'quantidade', width: 12 },
        { header: 'Saldo Real', key: 'saldo', width: 12 },
        { header: 'Diferença', key: 'diferenca', width: 12 },
        { header: 'Valor Total Perda', key: 'valor', width: 15 }
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
            valor: (r.diferenca * price)
        };
    });
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
        { header: 'Orçamento Previsto (R$)', key: 'orcamento_previsto', width: 22 },
        { header: 'Custo de Entrega Efetuado (R$)', key: 'orcamento_pago', width: 22 },
        { header: 'Saldo Orçamento (Economia/Estouro)', key: 'saldo_orcamento', width: 25 }
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
        { header: 'Mês/Ano', key: 'mes', width: 12 },
        { header: 'Admissão', key: 'admissao_formatted', width: 15 },
        { header: 'Colaborador', key: 'nome', width: 35 },
        { header: 'Base', key: 'base', width: 20 },
        { header: 'Estado', key: 'estado', width: 10 },
        { header: 'Função', key: 'funcao', width: 30 },
        { header: 'Demitido RH?', key: 'status_inativo', width: 15 },
        { header: 'Status Toolkit', key: 'status_toolkit', width: 15 },
        { header: 'Quantidade Recebida', key: 'qtd_recebida', width: 18 },
        { header: 'Quantidade Faltante', key: 'qtd_faltante', width: 18 },
        { header: 'Orçamento Gasto (R$)', key: 'orcamento_gasto', width: 20 }
    ];

    // Agregação dos dados por técnico
    const techAggregation = {};
    detailedRecords.forEach(r => {
        const id = r.codigo_equipe;
        if (!techAggregation[id]) {
            const info = techMap[id] || { estado: 'N/D', funcao: 'N/D' };
            
            // Checar se está na planilha de inativos
            const normalizedId = String(id).replace(/^0+/, '');
            const isInativo = inativosSet.has(normalizedId);

            techAggregation[id] = {
                mes: getMesAno(r.admissao),
                admissao_formatted: getFormattedDate(r.admissao),
                nome: removeAccents(r.nome_colaborador),
                base: removeAccents(r.filial),
                estado: info.estado,
                funcao: removeAccents(info.funcao),
                status_inativo: isInativo ? 'SIM' : 'NÃO',
                status_toolkit: 'SIM',
                qtd_recebida: 0,
                qtd_faltante: 0,
                orcamento_gasto: 0
            };
        }

        const normCode = String(r.codigo_item).replace(/^0+/, '');
        const price = parseFloat(precosMap[normCode]) || 0;
        const diff = parseFloat(r.diferenca) || 0;
        const saldo = parseFloat(r.saldo) || 0;

        techAggregation[id].qtd_recebida += saldo;
        
        if (diff < 0) {
            techAggregation[id].status_toolkit = 'NÃO';
            techAggregation[id].qtd_faltante += Math.abs(diff);
        }

        techAggregation[id].orcamento_gasto += (saldo * price);
    });

    const rows3 = Object.values(techAggregation);
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
    await workbook.xlsx.writeFile(filePath);
    console.log(`✨ RELATÓRIO CONSOLIDADO ATUALIZADO COM SUCESSO!`);
    console.log(`📍 Caminho: ${filePath}`);
}

exportCompleteReport().catch(console.error);
