# Melhores Práticas de Postgres no Supabase - Guia do Contribuidor

Esta skill contém referências de otimização de performance do Postgres otimizadas para agentes de IA e LLMs. Ela segue o [Agent Skills Open Standard](https://agentskills.io/).

## Início Rápido

```bash
# Da raiz do repositório
npm install

# Validar referências existentes
npm run validate

# Gerar AGENTS.md
npm run build
```

## Criando uma Nova Referência

1. **Escolha um prefixo de seção** baseado na categoria:
   - `query-` Performance de Consultas (CRÍTICO)
   - `conn-` Gerenciamento de Conexões (CRÍTICO)
   - `security-` Segurança & RLS (CRÍTICO)
   - `schema-` Design de Esquema (ALTO)
   - `lock-` Concorrência & Bloqueio (MÉDIO-ALTO)
   - `data-` Padrões de Acesso a Dados (MÉDIO)
   - `monitor-` Monitoramento & Diagnóstico (BAIXO-MÉDIO)
   - `advanced-` Recursos Avançados (BAIXO)

2. **Copie o template**:
   ```bash
   cp references/_template.md references/query-seu-nome-de-referencia.md
   ```

3. **Preencha o conteúdo** seguindo a estrutura do template.

4. **Valide e gere**:
   ```bash
   npm run validate
   npm run build
   ```

5. **Revise** o arquivo `AGENTS.md` gerado.

## Estrutura da Skill

```
skills/supabase-postgres-best-practices/
├── SKILL.md           # Manifesto da skill para o agente (especificação Agent Skills)
├── AGENTS.md          # [GERADO] Documento de referências compilado
├── README.md          # Este arquivo
└── references/
    ├── _template.md      # Template de referência
    ├── _sections.md      # Definições de seções
    ├── _contributing.md  # Diretrizes de escrita
    └── *.md              # Referências individuais

packages/skills-build/
├── src/               # Fonte do sistema de build genérico
└── package.json       # Scripts NPM
```

## Estrutura do Arquivo de Referência

Veja `references/_template.md` para o template completo. Elementos chave:

````markdown
---
title: Título Claro e Orientado a Ação
impact: CRITICAL|HIGH|MEDIUM-HIGH|MEDIUM|LOW-MEDIUM|LOW
impactDescription: Benefício quantificado (ex: "10-100x mais rápido")
tags: relevante, palavras-chave
---

## [Título]

[Explicação de 1-2 sentenças]

**Incorreto (descrição):**

```sql
-- Comentário explicando o que está errado
[Exemplo de SQL ruim]
```
````

**Correto (descrição):**

```sql
-- Comentário explicando por que isso é melhor
[Exemplo de SQL bom]
```

## Diretrizes de Escrita

Veja `references/_contributing.md` para diretrizes detalhadas. Princípios chave:

1. **Mostre transformações concretas** - "Mude X para Y", não conselhos abstratos
2. **Estrutura de erro primeiro** - Mostre o problema antes da solução
3. **Quantifique o impacto** - Inclua métricas específicas (10x mais rápido, 50% menor)
4. **Exemplos autocontidos** - SQL completo e executável
5. **Nomenclatura semântica** - Use nomes significativos (usuarios, email), não (tabela1, col1)

## Níveis de Impacto

| Nível | Melhoria | Exemplos |
|-------|----------|----------|
| CRÍTICO | 10-100x | Índices ausentes, exaustão de conexões |
| ALTO | 5-20x | Tipos de índices errados, particionamento ruim |
| MÉDIO-ALTO | 2-5x | Consultas N+1, otimização de RLS |
| MÉDIO | 1.5-3x | Índices redundantes, estatísticas obsoletas |
| BAIXO-MÉDIO | 1.2-2x | Ajuste de VACUUM, ajustes de config |
| BAIXO | Incremental | Padrões avançados, casos de borda |
