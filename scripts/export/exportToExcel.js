const { createClient } = require('@supabase/supabase-js');
const ExcelJS = require('exceljs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function exportToExcel() {
    console.log('--- Iniciando Exportação da View ---');
    
    // 1. Busca os dados da View (Aumentando o limite para cobrir todas as linhas)
    const { data, error } = await supabase
        .from('view_comparativo_toolkit')
        .select('*')
        .range(0, 20000); // Define um range alto para pegar tudo

    if (error) {
        console.error('Erro ao buscar dados:', error);
        return;
    }

    console.log(`Dados recuperados: ${data.length} linhas.`);

    // 2. Cria o Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Comparativo Toolkit');

    // Cabeçalhos
    worksheet.columns = [
        { header: 'Código Equipe', key: 'codigo_equipe', width: 15 },
        { header: 'Colaborador', key: 'nome_colaborador', width: 35 },
        { header: 'Contrato', key: 'contrato', width: 20 },
        { header: 'Admissão', key: 'admissao', width: 15 },
        { header: 'Filial', key: 'filial', width: 20 },
        { header: 'Descrição do Item', key: 'descricao_item', width: 40 },
        { header: 'Código do Item', key: 'codigo_item', width: 15 },
        { header: 'Família', key: 'familia', width: 20 },
        { header: 'Quantidade', key: 'quantidade', width: 12 },
        { header: 'Saldo', key: 'saldo', width: 12 },
        { header: 'Diferença', key: 'diferenca', width: 12 },
        { header: 'Valor', key: 'valor', width: 15 }
    ];

    // 3. Adiciona os dados
    worksheet.addRows(data);

    // 4. Estiliza o cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
    });

    // 5. Salva na Área de Trabalho
    const desktopPath = path.join('c:', 'Users', 'user', 'Desktop', 'ARQUVOS', 'PPROJETOS PROGRAMAÇÃO', 'Listagem Toolkit', 'Listagem_Toolkit_Final.xlsx');
    
    // O usuário pediu especificamente na área de trabalho, vamos tentar o caminho padrão
    const realDesktop = path.join('c:', 'Users', 'user', 'Desktop', 'Listagem_Toolkit_Final.xlsx');

    try {
        await workbook.xlsx.writeFile(realDesktop);
        console.log(`--- Sucesso! Arquivo salvo em: ${realDesktop} ---`);
    } catch (err) {
        console.error('Erro ao salvar arquivo:', err);
    }
}

exportToExcel();
