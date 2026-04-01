# Documentação Técnica: Consolidação e Auditoria de Toolkit (Março/2026)

Este documento descreve a lógica de negócio e os processos técnicos implementados para a auditoria de inventário ("Toolkit") e gestão orçamentária das contratações.

## 1. Objetivos do Projeto
*   **Conciliação de Inventário**: Cruzar o saldo real de materiais em posse dos técnicos com as quantidades padrão exigidas pelo contrato.
*   **Auditoria Financeira**: Identificar o impacto financeiro de materiais entregues em excesso (Perda Orçamentária).
*   **Gestão de Vagas**: Comparar a expectativa de contratações com a realidade do campo e o atingimento do orçamento planejado para o mês de Março.

## 2. Bases de Dados (Fontes da Verdade)
O sistema utiliza quatro pilares de dados integrados:
1.  **Técnicos Ativos (`contratado_2026`)**: Lista oficial de funcionários, datas de admissão, funções e departamentos.
2.  **Padrão de Toolkit (`listagem_toolkit`)**: Definição de quais itens e quantidades cada técnico deve possuir legalmente (Ex: 1 Escada, 1 Multímetro).
3.  **Saldo Real (`saldo_volante`)**: Dados extraídos do sistema de estoque (WMS/Aniel) que mostram o que o técnico realmente tem em mãos.
4.  **Tabela de Preços (`apoio_materiais_familia`)**: Valores unitários atualizados de todos os materiais.

## 3. Regras de Negócio e Lógica de Cálculo

### 3.1 Normalização de Dados
Para garantir a precisão no cruzamento (Join) das tabelas, implementamos:
*   **Código de Material**: Remoção automática de zeros à esquerda (Ex: `001045` = `1045`).
*   **Nomes e Textos**: Conversão para **CAIXA ALTA** e **remoção de acentos/caracteres especiais** para evitar duplicidade por erro de digitação.
*   **Mapeamento de Toolkit**: Lógica inteligente que identifica o kit correto baseado na combinação de Função + Departamento (Ex: "Instalador" em "Reserva Contratual" = Toolkit VIVO).

### 3.2 Ajustes de Quantidade (Toolkit Padrão)
Conforme definição estratégica, fixamos quantidades específicas para itens críticos:
*   **CONE**: 3 unidades padrão.
*   **PILHA**: 4 unidades padrão.
*   **MOSQUETÃO**: 3 unidades padrão.

### 3.3 Lógica Financeira (O que é considerado Perda?)
A "Perda" ou Gasto Excedente é calculada da seguinte forma:
1.  **Diferença** = `Saldo Real - Quantidade Padrão`.
2.  **Se a Diferença for POSITIVA**: Significa que o técnico tem material a mais do que o contratado. O valor é calculado como `Diferença * Preço Unitário`.
3.  **Se a Diferença for NEGATIVA**: Significa que o técnico está com material faltando. O valor financeiro é exibido como **NEGATIVO**, representando uma "Economia" ou valor que a empresa "deixou de pagar/entregar" no momento da auditoria.

## 4. Relatórios Gerenciais

### 4.1 Comparativo Detalhado (`tb_comparativo_toolkit`)
Relatório linha a linha com o status de cada um dos técnicos auditados. Permite visualizar item a item onde estão as sobras e faltas.

### 4.2 Consolidado de Vagas e Orçamento (`tb_resultado_vagas_consolidado`)
Visão executiva para o mês de Março que responde:
*   **Esperados**: Quantos técnicos planejamos contratar?
*   **Entraram**: Quantos realmente foram admitidos?
*   **Paguei a Mais**: Quantos desses novos técnicos receberam carga acima do padrão?
*   **Orçamento Pago**: Gasto total com kits para os novos técnicos + valor dos excessos entregues.
*   **Saldo Orçamento**: Diferença entre o que foi reservado financeiramente e o que foi gasto de fato.

---
**Status do Projeto:** Banco de Dados sincronizado, tabelas normalizadas e relatorios prontos para exportacao.
