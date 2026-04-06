---
name: test-as-repartidor
description: Guía para probar, navegar y verificar el proyecto como usuario Repartidor. Usa cuando necesites verificar que el repartidor solo ve y actualiza SUS deliveries asignados, sin acceso a ninguna otra sección.
---

# Probar como Repartidor

## Credenciales de Prueba

- **Email:** cyberdroidarmando@gmail.com
- **Rol:** repartidor
- **display_name en Supabase:** `repartidor`

## Acceso Permitido

| Ruta | Acceso | Qué verificar |
|------|--------|---------------|
| `/reportes` o `/deliveries` | ✅ Solo los suyos | Ver deliveries asignados a él |

## Acceso Denegado (todo lo demás)

| Ruta | Comportamiento esperado |
|------|------------------------|
| `/dashboard` | ❌ Redirigir o acceso denegado |
| `/pos` | ❌ Acceso denegado |
| `/productos` | ❌ Acceso denegado |
| `/promociones` | ❌ Acceso denegado |
| `/membresias` | ❌ Acceso denegado |
| `/sucursales` | ❌ Acceso denegado |
| `/configuracion` | ❌ Acceso denegado |

## Checklist de Pruebas

### Vista de Deliveries
- [ ] Solo ve pedidos donde `repartidor_id = su_id`
- [ ] No ve deliveries asignados a otros repartidores
- [ ] Puede actualizar el estado del delivery:
  - `Pendiente` → `En camino` (registra timestamp)
  - `En camino` → `Entregado` (registra timestamp)
- [ ] No puede modificar otros campos del pedido (precio, dirección, etc.)

### Navegación
- [ ] Al hacer login redirige directamente a su vista de deliveries
- [ ] No tiene acceso al sidebar completo
- [ ] Solo ve su nombre y sus pedidos activos

### Seguridad RLS
- [ ] La política RLS filtra por `repartidor_id = auth.uid()`
- [ ] Intentar ver pedidos de otro repartidor retorna vacío

## Cómo Verificar RLS en Supabase

```sql
SET LOCAL request.jwt.claim.sub = '7510d5b2-85ab-40f1-8ae6-f2a41d1dcfa9';
SET LOCAL request.jwt.claim.user_metadata = '{"display_name": "repartidor"}';

-- Debe retornar SOLO sus deliveries
SELECT id, delivery_status, delivery_address, created_at
FROM ventas
WHERE tipo_pedido = 'delivery'
ORDER BY created_at DESC;

-- Debe retornar 0 filas (no puede ver pedidos de otros)
SELECT COUNT(*) FROM ventas
WHERE tipo_pedido = 'delivery'
  AND repartidor_id != '7510d5b2-85ab-40f1-8ae6-f2a41d1dcfa9';
```

## Estados de Delivery

| Estado | Timestamp guardado | Acción permitida |
|--------|-------------------|-----------------|
| `pendiente` | — | Cambiar a "En camino" |
| `en_camino` | `picked_up_at` | Cambiar a "Entregado" |
| `entregado` | `delivered_at` | Solo lectura |
