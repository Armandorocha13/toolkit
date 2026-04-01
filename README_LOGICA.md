# CONTROLE TOOLKIT System v2.0 - Automação Completa

Este projeto foi evoluído para uma plataforma de auditoria com interface web, eliminando a necessidade de uso direto do terminal para operações do dia a dia.

## 🚀 Como Iniciar

Para rodar o painel de controle locally:
1. Abra o terminal na pasta raiz.
2. Execute: `node server.js`
3. Acesse no seu navegador: `http://localhost:3000/index.html`

## 🛠️ Funcionalidades da Interface

### 1. Sincronização Inteligente (Importação)
A interface permite o upload dos três arquivos Excel principais:
*   **Saldo Volante**: O sistema realiza a **substituição total** (Overwrite), garantindo que o estoque reflita exatamente o arquivo enviado.
*   **Contratados & Inativos**: O sistema cria um **registro histórico**. Ao importar, ele substitui apenas os dados do mês de referência selecionado, mantendo o histórico de meses anteriores no banco de dados.

### 2. Exportação Dinâmica
Gera o arquivo `CONTROLE DE TOOLKIT.xlsx` processando:
*   Dados dinâmicos do estoque (WMS).
*   Cruzamento com base de inativos (RH).
*   Seleção de mês de auditoria (ex: Março/2026 vs Abril/2026).

---

## 🏗️ Estrutura de Pastas Organizada

*   `/dashboard`: Interface web (HTML/CSS/JS).
*   `/scripts/import`: Scripts especializados em alimentação do Supabase.
*   `/scripts/export`: Scripts de geração de relatórios e BI.
*   `/dados`: Repositório local de planilhas (Sincronizado via Dashboard).
*   `server.js`: Motor Node.js que orquestra toda a automação.

---
© 2026 - Desenvolvido para Gestão de Inventário de Campo.
