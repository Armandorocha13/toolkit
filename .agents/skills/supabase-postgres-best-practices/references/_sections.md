# Definições de Seção

Este arquivo define as categorias de regras para as melhores práticas de Postgres. As regras são atribuídas automaticamente às seções com base no prefixo de seus nomes de arquivo.

Considere os exemplos abaixo apenas como demonstrativos. Substitua cada seção pelas categorias reais de regras para as melhores práticas do Postgres.

---

## 1. Performance de Consultas (query)
**Impacto:** CRÍTICO
**Descrição:** Consultas lentas, índices ausentes, planos de consulta ineficientes. A fonte mais comum de problemas de performance no Postgres.

## 2. Gerenciamento de Conexões (conn)
**Impacto:** CRÍTICO
**Descrição:** Pooling de conexões, limites e estratégias serverless. Crítico para aplicações com alta concorrência ou implantações serverless.

## 3. Segurança & RLS (security)
**Impacto:** CRÍTICO
**Descrição:** Políticas de Row-Level Security, gerenciamento de privilégios e padrões de autenticação.

## 4. Design de Esquema (schema)
**Impacto:** ALTO
**Descrição:** Design de tabelas, estratégias de índices, particionamento e seleção de tipos de dados. Fundação para performance a longo prazo.

## 5. Concorrência & Bloqueio (lock)
**Impacto:** MÉDIO-ALTO
**Descrição:** Gerenciamento de transações, níveis de isolamento, prevenção de deadlock e padrões de contenção de bloqueio.

## 6. Padrões de Acesso a Dados (data)
**Impacto:** MÉDIO
**Descrição:** Eliminação de consultas N+1, operações em lote, paginação baseada em cursor e busca eficiente de dados.

## 7. Monitoramento & Diagnóstico (monitor)
**Impacto:** BAIXO-MÉDIO
**Descrição:** Uso de pg_stat_statements, EXPLAIN ANALYZE, coleta de métricas e diagnóstico de performance.

## 8. Recursos Avançados (advanced)
**Impacto:** BAIXO
**Descrição:** Busca de texto completo (full-text search), otimização de JSONB, PostGIS, extensões e recursos avançados do Postgres.
