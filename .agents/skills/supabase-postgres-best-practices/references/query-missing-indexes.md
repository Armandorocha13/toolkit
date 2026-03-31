---
title: Adicione Índices em Colunas de WHERE e JOIN
impact: CRITICAL
impactDescription: Consultas 100-1000x mais rápidas em tabelas grandes
tags: índices, performance, sequential-scan, otimização-de-consulta
---

## Adicione Índices em Colunas de WHERE e JOIN

Consultas que filtram ou fazem join em colunas não indexadas causam escaneamentos completos da tabela (full table scans), que se tornam exponencialmente mais lentos conforme as tabelas crescem.

**Incorreto (sequential scan em tabela grande):**

```sql
-- A falta de índice em customer_id causa um scan sequencial completo
select * from orders where customer_id = 123;

-- EXPLAIN mostra: Seq Scan on orders (cost=0.00..25000.00 rows=100 width=85)
```

**Correto (index scan):**

```sql
-- Criação de índice em coluna frequentemente filtrada
create index orders_customer_id_idx on orders (customer_id);

select * from orders where customer_id = 123;

-- EXPLAIN mostra: Index Scan using orders_customer_id_idx (cost=0.42..8.44 rows=100 width=85)
```

Para colunas de JOIN, sempre indexe o lado da chave estrangeira:

```sql
-- Indexe a coluna de referência
create index orders_customer_id_idx on orders (customer_id);

select c.name, o.total
from customers c
join orders o on o.customer_id = c.id;
```

Referência: [Otimização de Consultas](https://supabase.com/docs/guides/database/query-optimization)

---
title: Use Pooling de Conexões em Todas as Aplicações
impact: CRITICAL
impactDescription: Lida com 10-100x mais usuários simultâneos
tags: pooling-de-conexoes, pgbouncer, performance, escalabilidade
---

## Use Pooling de Conexões em Todas as Aplicações

Conexões no Postgres são caras (1-3MB de RAM cada). Sem pooling, as aplicações esgotam as conexões sob carga.

**Incorreto (nova conexão por requisição):**

```sql
-- Cada requisição cria uma nova conexão
-- Código da aplicação: db.connect() por requisição
-- Resultado: 500 usuários simultâneos = 500 conexões = banco de dados travado

-- Verificação das conexões atuais
select count(*) from pg_stat_activity;  -- 487 conexões!
```

**Correto (pooling de conexões):**

```sql
-- Use um pooling como PgBouncer entre o app e o banco de dados
-- O aplicativo se conecta ao pooler, o pooler reutiliza um pequeno pool para o Postgres

-- Configure pool_size com base em: (núcleos da CPU * 2) + contagem_de_discos
-- Exemplo para 4 núcleos: pool_size = 10

-- Resultado: 500 usuários simultâneos compartilham 10 conexões reais
select count(*) from pg_stat_activity;  -- 10 conexões
```

Modos de pool:

- **Modo Transação (Transaction mode)**: conexão devolvida após cada transação (melhor para a maioria dos apps)
- **Modo Sessão (Session mode)**: conexão mantida por toda a sessão (necessário para prepared statements, tabelas temporárias)

Referência: [Pooling de Conexões](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
