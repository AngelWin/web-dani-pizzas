---
name: test-as-cajero
description: Guía para probar, navegar y verificar el proyecto como usuario Cajero. Usa cuando necesites verificar que el cajero solo accede a POS y reportes básicos de su propia sucursal.
---

# Probar como Cajero

## Credenciales de Prueba

- **Email:** abadvasquezangelxm@gmail.com
- **Rol:** cajero
- **display_name en Supabase:** `cajero`

## Acceso Permitido

| Ruta | Acceso | Qué verificar |
|------|--------|---------------|
| `/pos` | ✅ Completo | Crear ventas SOLO para su sucursal |
| `/reportes` | ✅ Básico | Ver reportes SOLO de su sucursal |
| `/dashboard` | ✅ Limitado | Solo datos de su sucursal |

## Acceso Denegado (debe redirigir o mostrar error)

| Ruta | Comportamiento esperado |
|------|------------------------|
| `/productos` | ❌ Redirigir a `/dashboard` o mostrar 403 |
| `/promociones` | ❌ Acceso denegado |
| `/membresias` | ❌ Acceso denegado |
| `/sucursales` | ❌ Acceso denegado |
| `/configuracion` | ❌ Acceso denegado |

## Checklist de Pruebas

### POS — Flujos Principales
- [ ] Crear pedido "Para llevar" — registra correctamente
- [ ] Crear pedido "Delivery Propio" — solo ve repartidores de SU sucursal
- [ ] Crear pedido "Delivery Tercero" — selecciona Rappi/PedidosYa/Glovo/Otro
- [ ] El costo de delivery se toma de `delivery_fees_config` de su sucursal
- [ ] NO puede cambiar la sucursal de origen (fija a la suya)

### Reportes
- [ ] Solo ve ventas de SU sucursal
- [ ] Puede filtrar por tipo delivery
- [ ] NO puede ver ventas de la otra sucursal

### Seguridad RLS
- [ ] La consulta a `ventas` solo retorna registros de su `sucursal_id`
- [ ] Intentar acceder a datos de otra sucursal retorna vacío (no error)

## Cómo Verificar RLS en Supabase

```sql
-- Simular sesión de cajero (reemplazar UUID con el de su perfil)
SET LOCAL request.jwt.claim.sub = 'ffb5b625-bc79-437a-886c-ce1cc798702e';
SET LOCAL request.jwt.claim.user_metadata = '{"display_name": "cajero"}';

-- Debe retornar solo ventas de su sucursal
SELECT * FROM ventas LIMIT 5;
-- Debe retornar vacío o error para otra sucursal
SELECT * FROM ventas WHERE sucursal_origen_id != (SELECT sucursal_id FROM profiles WHERE id = auth.uid());
```
