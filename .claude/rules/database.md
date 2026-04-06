---
paths: "app/actions/**/*.ts,lib/supabase/**/*.ts,supabase/**/*.sql"
---

# Reglas de Base de Datos - DANI PIZZAS

## Proyecto Supabase

- Project ID: `tdmpzdssbxewbuosldof`
- URL: `https://tdmpzdssbxewbuosldof.supabase.co`

## Tablas Principales

- `roles` — Tabla dinámica de roles (administrador, cajero, mesero, repartidor, etc.)
- `sucursales` — Casma Av. Reina, Villa Hermosa Calle Uno
- `profiles` — Extiende auth.users con datos personales + rol_id FK a roles + sucursal_id
- `productos` — Catálogo de productos
- `promociones` — Promociones con fecha inicio/fin
- `membresias_niveles` — Niveles de membresía
- `membresias` — Relación 1:N profiles ↔ membresias_niveles (puntos, nivel activo)
- `reglas_puntos` — Reglas del programa de puntos
- `ventas` — Ventas con tipo_pedido, delivery info, sucursal
- `delivery_fees_config` — Tarifas de delivery por sucursal

## Roles (desde tabla `roles`, dinámicos)

- Los roles se gestionan en la tabla `public.roles` (escalable, no hardcodeados)
- `profiles.rol_id` → FK a `roles.id`
- Función `get_user_role()` hace JOIN profiles → roles para obtener el nombre del rol
- Roles iniciales: administrador, cajero, mesero, repartidor

## Profiles

- Campos: nombre, segundo_nombre, apellido_paterno, apellido_materno, tipo_documento (DNI/CE), numero_documento, fecha_nacimiento, edad, sexo, foto_url, celular, codigo_pais, codigo_qr, estado (enum: activo/inactivo/eliminado)
- Trigger `handle_new_user()` crea perfil automáticamente al registrarse
- Storage bucket `perfiles` para fotos (RLS por auth.uid())

## Convenciones SQL

- Nombres en `snake_case`
- Siempre incluir `id`, `created_at`, `updated_at`
- RLS habilitado en TODAS las tablas
- Filtrar por `sucursal_id` en todas las queries
- Usar Server Actions para mutations, Supabase client para reads
