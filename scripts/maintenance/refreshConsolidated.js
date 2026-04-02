const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function refreshConsolidated() {
    console.log('🔄 Iniciando Consolidação dos Dados de Toolkit...');

    const refreshQuery = `
        -- 1. Congelar Tabela Física baseada na View Fundamental atualizada (v13)
        DROP TABLE IF EXISTS tb_comparativo_toolkit_consolidado CASCADE;
        CREATE TABLE tb_comparativo_toolkit_consolidado AS 
        SELECT * FROM view_comparativo_toolkit;

        -- 2. Recriar Views de Aba para garantir sincronia com a nova tabela
        DROP VIEW IF EXISTS view_toolkit_aba1_detalhado CASCADE;
        CREATE VIEW view_toolkit_aba1_detalhado AS
        SELECT 
            codigo_equipe AS matricula, 
            nome_colaborador AS nome, 
            contrato AS tipo_toolkit, 
            admissao, 
            filial AS base, 
            descricao_item, 
            codigo_item, 
            familia, 
            preco_unitario, 
            quantidade AS quantidade_padrao, 
            saldo AS saldo_funcionario, 
            diferenca, 
            valor AS valor_diferenca,
            estado_contrato,
            funcao,
            na_lista_inativos
        FROM tb_comparativo_toolkit_consolidado;

        DROP VIEW IF EXISTS view_toolkit_aba3_resumo_tecnico CASCADE;
        CREATE VIEW view_toolkit_aba3_resumo_tecnico AS
        SELECT vct.matricula,
            vct.nome,
            max(vct.admissao) AS admissao,
            max(vct.base) AS base,
            max(vct.estado_contrato) AS estado,
            max(vct.funcao) AS funcao,
            CASE WHEN bool_or(vct.na_lista_inativos) THEN 'SIM'::text ELSE 'NÃO'::text END AS status_demitido,
            CASE
                WHEN bool_or(vct.estado_contrato = 'INATIVO'::text) THEN 'DEMITIDO'::text
                WHEN bool_or(normalize_tech_name(vct.nome) IN (SELECT nome_colaborador_up FROM verified_complete_techs)) THEN 'LISTAGEM COMPLETA'::text
                WHEN (min(diferenca) < 0) THEN 'ITENS PENDENTES'::text
                ELSE 'LISTAGEM COMPLETA'::text
            END AS status_toolkit
        FROM view_toolkit_aba1_detalhado vct
        GROUP BY vct.matricula, vct.nome;
    `;

    try {
        const { error } = await supabase.rpc('execute_sql_batch', { query: refreshQuery });
        
        if (error) {
            // Se o RPC não estiver disponível, tentamos via query direta (fallback se suportado pelo cliente)
            console.log('⚠️ Tentando via query direta (fallback)...');
            const { error: error2 } = await supabase.from('_dummy').select('*').limit(0); // Trigger para check
            // Nota: Supabase client comum não roda SQL arbitrário, mas aqui assumimos que o ambiente 
            // permite execução via helper ou que o usuário tem a função execute_sql_batch.
            throw error;
        }

        console.log('✅ Consolidação concluída com sucesso!');
    } catch (err) {
        console.error('❌ Erro na consolidação:', err.message);
        process.exit(1);
    }
}

refreshConsolidated();
