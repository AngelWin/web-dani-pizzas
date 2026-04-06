---
name: supabase-best-practices
description: Best practices for Supabase with PostgreSQL. Use when creating tables, migrations, RLS policies, queries, or any database operation in Supabase. Includes security, performance, and schema design guidelines.
---

# Supabase + PostgreSQL Best Practices para DANI PIZZAS

## Convenciones de Schema

- Usar `snake_case` para nombres de tablas y columnas
- Siempre incluir `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
- Siempre incluir `created_at TIMESTAMPTZ DEFAULT NOW()`
- Siempre incluir `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Usar tipos nativos de PostgreSQL: `TIMESTAMPTZ`, `NUMERIC`, `TEXT`, `BOOLEAN`, `UUID`
- Usar `TEXT` en lugar de `VARCHAR` (PostgreSQL los trata igual internamente)
- Crear índices para columnas usadas en WHERE, JOIN, ORDER BY

## Row Level Security (RLS)

- **SIEMPRE** habilitar RLS en todas las tablas: `ALTER TABLE tabla ENABLE ROW LEVEL SECURITY;`
- Crear políticas específicas por rol usando `auth.jwt()->>'role'` o `(auth.jwt()->'user_metadata'->>'display_name')`
- El admin tiene acceso total
- Los cajeros solo ven datos de su sucursal
- Los repartidores solo ven sus deliveries asignados
- Los meseros solo ven pedidos de su sucursal

## Políticas RLS Pattern

```sql
-- Admin: acceso total
CREATE POLICY "admin_full_access" ON tabla
  FOR ALL USING (
    (auth.jwt()->'user_metadata'->>'display_name') = 'administrador'
  );

-- Cajero/Mesero: solo su sucursal
CREATE POLICY "staff_sucursal" ON tabla
  FOR SELECT USING (
    sucursal_id = (SELECT sucursal_id FROM profiles WHERE id = auth.uid())
  );
```

## Triggers Comunes

```sql
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON tabla
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## Queries

- Usar Supabase JS client para queries desde el frontend
- Usar Server Actions de Next.js para mutations
- Siempre filtrar por `sucursal_id` en queries multi-sucursal
- Usar `.select()` con columnas específicas, evitar `select('*')` en producción
- Usar `.order()` para resultados consistentes

## Seguridad

- Nunca exponer `service_role_key` en el frontend
- Usar `NEXT_PUBLIC_SUPABASE_ANON_KEY` solo para operaciones con RLS
- Validar datos en el servidor antes de insertar
- Usar `zod` para validación de esquemas
