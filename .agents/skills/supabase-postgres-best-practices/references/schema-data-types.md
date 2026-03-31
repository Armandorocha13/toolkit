---
title: Escolha os Tipos de Dados Apropriados
impact: HIGH
impactDescription: Redução de 50% no armazenamento, comparações mais rápidas
tags: tipos-de-dados, esquema, armazenamento, performance
---

## Escolha os Tipos de Dados Apropriados

O uso dos tipos de dados corretos reduz o armazenamento, melhora o desempenho das consultas e evita bugs.

**Incorreto (tipos de dados errados):**

```sql
create table users (
  id int,                    -- Vai estourar em 2,1 bilhões
  email varchar(255),        -- Limite de comprimento desnecessário
  created_at timestamp,      -- Falta informação de fuso horário
  is_active varchar(5),      -- String para booleano
  price varchar(20)          -- String para numérico
);
```

**Correto (tipos de dados apropriados):**

```sql
create table users (
  id bigint generated always as identity primary key,  -- Máximo de 9 quintilhões
  email text,                     -- Sem limite artificial, mesma performance que varchar
  created_at timestamptz,         -- Sempre armazene carimbos de data/hora cientes do fuso horário
  is_active boolean default true, -- 1 byte vs comprimento de string variável
  price numeric(10,2)             -- Aritmética decimal exata
);
```

Diretrizes principais:

```sql
-- IDs: use bigint, não int (preparando para o futuro)
-- Strings: use text, não varchar(n), a menos que uma restrição seja necessária
-- Tempo: use timestamptz, não timestamp
-- Dinheiro: use numeric, não float (precisão importa)
-- Enums: use text com check constraint ou crie um tipo enum
```

Referência: [Tipos de Dados](https://www.postgresql.org/docs/current/datatype.html)
