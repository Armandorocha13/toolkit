const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dldvrpiwdenxpknquvpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wXrXxklY847tvHXdnY9RkA_aysrKB3X';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportFinal() {
    console.log("📥 Consultando dados finais do banco...");
    const { data: records, error } = await supabase
        .from('tb_comparativo_toolkit')
        .select('*')
        .order('nome_colaborador', { ascending: true })
        .order('codigo_item', { ascending: true });

    if (error) {
        console.error("❌ Erro ao buscar dados:", error.message);
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório Consolidado');

    worksheet.columns = [
        { header: 'Cod Equipe', key: 'codigo_equipe' },
        { header: 'Colaborador', key: 'nome_colaborador' },
        { header: 'Contrato', key: 'contrato' },
        { header: 'Admissão', key: 'admissao' },
        { header: 'Filial', key: 'filial' },
        { header: 'Material', key: 'descricao_item' },
        { header: 'Código Material', key: 'codigo_item' },
        { header: 'Família', key: 'familia' },
        { header: 'Qtd Padrão', key: 'quantidade' },
        { header: 'Saldo Real', key: 'saldo' },
        { header: 'Diferença', key: 'diferenca' },
        { header: 'Valor Perda (R$)', key: 'valor' }
    ];

    worksheet.addRows(records);

    // Formatação de cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    const filePath = 'c:\\Users\\user\\Desktop\\ARQUVOS\\PPROJETOS PROGRAMAÇÃO\\Listagem Toolkit\\dados\\view_consolidada_final.xlsx';
    await workbook.xlsx.writeFile(filePath);
    console.log(`✅ Relatório exportado com sucesso em: ${filePath}`);
    console.log(`📊 Total de linhas: ${records.length}`);
}

exportFinal();
