---
paths: "app/actions/**/*.ts,lib/supabase/**/*.ts,supabase/**/*.sql"
---

# Reglas de Base de Datos - DANI PIZZAS

## Proyecto Supabase

- Project ID: `tdmpzdssbxewbuosldof`
- URL: `https://tdmpzdssbxewbuosldof.supabase.co`

## Tablas Principales

- `sucursales` — Casma Av. Reina, Villa Hermosa Calle Uno
- `profiles` — Extiende auth.users con role + sucursal_id
- `productos` — Catálogo de productos
- `promociones` — Promociones con fecha inicio/fin
- `membresias_niveles` — Niveles de membresía
- `reglas_puntos` — Reglas del programa de puntos
- `ventas` — Ventas con tipo_pedido, delivery info, sucursal
- `delivery_fees_config` — Tarifas de delivery por sucursal

## Roles (desde auth.users.raw_user_meta_data->>'display_name')

- `administrador` — Acceso total
- `cajero` — POS + reportes básicos (solo su sucursal)
- `mesero` — POS para pedidos en local (solo su sucursal)
- `repartidor` — Solo sus deliveries asignados

## Convenciones SQL

- Nombres en `snake_case`
- Siempre incluir `id`, `created_at`, `updated_at`
- RLS habilitado en TODAS las tablas
- Filtrar por `sucursal_id` en todas las queries
- Usar Server Actions para mutations, Supabase client para reads
