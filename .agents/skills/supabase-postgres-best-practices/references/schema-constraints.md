---
title: Adicione Constraints com Segurança em Migrações
impact: HIGH
impactDescription: Evita falhas em migrações e permite alterações de esquema idempotentes
tags: constraints, migrações, esquema, alter-table
---

## Adicione Constraints com Segurança em Migrações

O PostgreSQL não suporta `ADD CONSTRAINT IF NOT EXISTS`. Migrações usando esta sintaxe falharão.

**Incorreto (causa erro de sintaxe):**

```sql
-- ERRO: erro de sintaxe em ou próximo a "not" (SQLSTATE 42601)
alter table public.profiles
add constraint if not exists profiles_birthchart_id_unique unique (birthchart_id);
```

**Correto (criação de constraint idempotente):**

```sql
-- Use bloco DO para verificar antes de adicionar
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_birthchart_id_unique'
    and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_birthchart_id_unique unique (birthchart_id);
  end if;
end $$;
```

Para todos os tipos de restrição:

```sql
-- Check constraints
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'check_age_positive'
  ) then
    alter table users add constraint check_age_positive check (age > 0);
  end if;
end $$;

-- Foreign keys
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_birthchart_id_fkey'
  ) then
    alter table profiles
    add constraint profiles_birthchart_id_fkey
    foreign key (birthchart_id) references birthcharts(id);
  end if;
end $$;
```

Verificar se a restrição existe:

```sql
-- Consulta para verificar existência de constraint
select conname, contype, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.profiles'::regclass;

-- valores de contype:
-- 'p' = PRIMARY KEY
-- 'f' = FOREIGN KEY
-- 'u' = UNIQUE
-- 'c' = CHECK
```

Referência: [Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
