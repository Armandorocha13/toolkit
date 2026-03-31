---
title: Otimize Políticas RLS para Performance
impact: HIGH
impactDescription: Consultas RLS 5-10x mais rápidas com padrões adequados
tags: rls, performance, segurança, otimização
---

## Otimize Políticas RLS para Performance

Políticas RLS mal escritas podem causar sérios problemas de performance. Use subconsultas e índices estrategicamente.

**Incorreto (função chamada para cada linha):**

```sql
create policy orders_policy on orders
  using (auth.uid() = user_id);  -- auth.uid() chamado por linha!

-- Com 1 milhão de linhas, auth.uid() é chamado 1 milhão de vezes
```

**Correto (embrulhar funções em SELECT):**

```sql
create policy orders_policy on orders
  using ((select auth.uid()) = user_id);  -- Chamado uma vez, cacheado

-- 100x+ mais rápido em tabelas grandes
```

Use funções `security definer` para verificações complexas:

```sql
-- Criar função auxiliar (roda como definer, ignora RLS)
create or replace function is_team_member(team_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = $1 and user_id = (select auth.uid())
  );
$$;

-- Usar na política (busca indexada, não verificação por linha)
create policy team_orders_policy on orders
  using ((select is_team_member(team_id)));
```

Sempre adicione índices em colunas usadas em políticas RLS:

```sql
create index orders_user_id_idx on orders (user_id);
```

Referência: [RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
