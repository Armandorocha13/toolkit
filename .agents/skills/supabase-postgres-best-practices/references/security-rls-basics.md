---
title: Habilite Row Level Security para Dados Multi-Tenant
impact: CRITICAL
impactDescription: Isolamento de inquilino (tenant) forçado no banco de dados, evita vazamento de dados
tags: rls, row-level-security, multi-tenant, segurança
---

## Habilite Row Level Security para Dados Multi-Tenant

Row Level Security (RLS) impõe o acesso aos dados no nível do banco de dados, garantindo que os usuários vejam apenas seus próprios dados.

**Incorreto (filtragem apenas no nível da aplicação):**

```sql
-- Confiando apenas na aplicação para filtrar
select * from orders where user_id = $current_user_id;

-- Um bug ou bypass significa que todos os dados são expostos!
select * from orders;  -- Retorna TODAS as ordens
```

**Correto (RLS forçado no banco de dados):**

```sql
-- Habilitar RLS na tabela
alter table orders enable row level security;

-- Criar política para que os usuários vejam apenas suas ordens
create policy orders_user_policy on orders
  for all
  using (user_id = current_setting('app.current_user_id')::bigint);

-- Forçar RLS mesmo para os donos da tabela
alter table orders force row level security;

-- Definir contexto do usuário e consultar
set app.current_user_id = '123';
select * from orders;  -- Retorna apenas ordens para o usuário 123
```

Política para o papel (role) autenticado:

```sql
create policy orders_user_policy on orders
  for all
  to authenticated
  using (user_id = auth.uid());
```

Referência: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
