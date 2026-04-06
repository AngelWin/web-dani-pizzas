---
name: test-as-mesero
description: Guía para probar, navegar y verificar el proyecto como usuario Mesero. Usa cuando necesites verificar que el mesero solo puede tomar pedidos en local de su sucursal, sin acceso a delivery ni configuración.
---

# Probar como Mesero

## Credenciales de Prueba

- **Email:** angel_aav53@hotmail.com
- **Rol:** mesero
- **display_name en Supabase:** `mesero`

## Acceso Permitido

| Ruta | Acceso | Qué verificar |
|------|--------|---------------|
| `/pos` | ✅ Limitado | Solo pedidos "Para llevar" y "En local" de su sucursal |
| `/dashboard` | ✅ Limitado | Solo ventas de su turno/sucursal |

## Acceso Denegado

| Ruta | Comportamiento esperado |
|------|------------------------|
| `/pos` (delivery) | ❌ Opción Delivery no disponible o deshabilitada |
| `/reportes` | ❌ Acceso denegado |
| `/productos` | ❌ Acceso denegado |
| `/promociones` | ❌ Acceso denegado |
| `/membresias` | ❌ Acceso denegado |
| `/sucursales` | ❌ Acceso denegado |
| `/configuracion` | ❌ Acceso denegado |

## Checklist de Pruebas

### POS — Flujos Permitidos
- [ ] Puede crear pedido "Para llevar" correctamente
- [ ] Puede crear pedido "En local" (con mesa o referencia)
- [ ] El tipo "Delivery" NO aparece disponible (o está deshabilitado)
- [ ] Solo ve productos activos de su sucursal
- [ ] NO puede cambiar la sucursal de origen

### Restricciones de Delivery
- [ ] El mesero NO puede seleccionar método de delivery
- [ ] NO accede a la lista de repartidores
- [ ] NO ve campos de dirección de delivery

### Seguridad RLS
- [ ] Solo ve pedidos/ventas de su sucursal
- [ ] No puede crear ventas de tipo `delivery`

## Cómo Verificar RLS en Supabase

```sql
SET LOCAL request.jwt.claim.sub = '8e35a63e-7ad1-4895-ae15-4f6c0a218f58';
SET LOCAL request.jwt.claim.user_metadata = '{"display_name": "mesero"}';

-- Solo debe ver ventas tipo "para_llevar" o "en_local" de su sucursal
SELECT tipo_pedido, COUNT(*) FROM ventas
WHERE sucursal_origen_id = (SELECT sucursal_id FROM profiles WHERE id = auth.uid())
GROUP BY tipo_pedido;
```
