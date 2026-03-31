# Melhores Práticas de Postgres no Supabase

## Estrutura

```
supabase-postgres-best-practices/
  SKILL.md       # Arquivo principal da skill - leia primeiro
  AGENTS.md      # Este guia de navegação
  CLAUDE.md      # Link simbólico para AGENTS.md
  references/    # Arquivos de referência detalhados
```

## Uso

1. Leia `SKILL.md` para as instruções principais da skill
2. Navegue em `references/` para documentação detalhada sobre tópicos específicos
3. Arquivos de referência são carregados sob demanda - leia apenas o que precisar

Guia abrangente de otimização de performance para Postgres, mantido pela Supabase. Contém regras em 8 categorias, priorizadas por impacto para orientar a otimização automatizada de consultas e o design do esquema.

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
