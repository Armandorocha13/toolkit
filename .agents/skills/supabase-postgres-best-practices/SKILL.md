---
name: supabase-postgres-best-practices
description: Melhores práticas e otimização de performance do Postgres para Supabase. Use esta skill ao escrever, revisar ou otimizar consultas Postgres, designs de esquema ou configurações de banco de dados.
license: MIT
metadata:
  author: supabase
  version: "1.1.0"
  organization: Supabase
  date: Janeiro 2026
  abstract: Guia abrangente de otimização de performance do Postgres para desenvolvedores que utilizam Supabase e Postgres. Contém regras de performance em 8 categorias, priorizadas por impacto de crítico (performance de consulta, gerenciamento de conexões) a incremental (recursos avançados). Cada regra inclui explicações detalhadas, exemplos de SQL incorretos vs. corretos, análise de plano de consulta e métricas de desempenho específicas para orientar a otimização automatizada e a geração de código.
---

# Melhores Práticas de Postgres no Supabase

Guia abrangente de otimização de performance para Postgres, mantido pela Supabase. Contém regras divididas em 8 categorias, priorizadas por impacto para orientar a otimização automatizada de consultas e o design do esquema.

## Quando Aplicar

Consulte estas diretrizes ao:
- Escrever consultas SQL ou desenhar esquemas
- Implementar índices ou otimizar consultas
- Revisar problemas de performance do banco de dados
- Configurar pooling de conexões ou escalonamento
- Otimizar para recursos específicos do Postgres
- Trabalhar com Row-Level Security (RLS)

## Categorias de Regras por Prioridade

| Prioridade | Categoria | Impacto | Prefixo |
|------------|-----------|---------|---------|
| 1 | Performance de Consultas | CRÍTICO | `query-` |
| 2 | Gerenciamento de Conexões | CRÍTICO | `conn-` |
| 3 | Segurança & RLS | CRÍTICO | `security-` |
| 4 | Design de Esquema | ALTO | `schema-` |
| 5 | Concorrência & Bloqueio | MÉDIO-ALTO | `lock-` |
| 6 | Padrões de Acesso a Dados | MÉDIO | `data-` |
| 7 | Monitoramento & Diagnóstico | BAIXO-MÉDIO | `monitor-` |
| 8 | Recursos Avançados | BAIXO | `advanced-` |

## Como Usar

Leia os arquivos de regras individuais para explicações detalhadas e exemplos de SQL:

```
references/query-missing-indexes.md
references/schema-partial-indexes.md
references/_sections.md
```

Cada arquivo de regra contém:
- Breve explicação de por que isso importa
- Exemplo de SQL incorreto com explicação
- Exemplo de SQL correto com explicação
- Saída EXPLAIN opcional ou métricas
- Contexto adicional e referências
- Notas específicas do Supabase (quando aplicável)

## Referências

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security
