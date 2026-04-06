---
name: test-as-administrador
description: Guía para probar, navegar y verificar el proyecto como usuario Administrador. Usa cuando necesites verificar que todas las rutas, permisos y funcionalidades de admin funcionan correctamente.
---

# Probar como Administrador

## Credenciales de Prueba

- **Email:** abadvasquezangel@gmail.com
- **Rol:** administrador
- **display_name en Supabase:** `administrador`

## Acceso Completo — Rutas a Verificar

El administrador debe poder acceder a TODAS las rutas sin restricción:

| Ruta | Qué verificar |
|------|---------------|
| `/dashboard` | Ver ventas del día, gráficos, filtro por sucursal (ambas sucursales visibles) |
| `/pos` | Crear ventas para cualquier sucursal |
| `/productos` | Crear, editar, eliminar productos |
| `/promociones` | Crear promociones con fecha inicio/fin |
| `/membresias` | Ver y gestionar niveles de membresía y reglas de puntos |
| `/reportes` | Ver reportes de todas las sucursales, filtrar por delivery y sucursal |
| `/sucursales` | Ver y editar: "Casma Av. Reina" y "Villa Hermosa Calle Uno" |
| `/configuracion` | Editar tarifas de delivery (Propio: 3 soles, Tercero: 4 soles) |

## Checklist de Pruebas

### Dashboard
- [ ] Se muestran ventas de AMBAS sucursales
- [ ] El filtro por sucursal funciona
- [ ] Los gráficos renderizan correctamente

### POS
- [ ] Puede crear pedido tipo "Para llevar"
- [ ] Puede crear pedido tipo "En local"
- [ ] Puede crear pedido tipo "Delivery Propio" (selecciona repartidor)
- [ ] Puede crear pedido tipo "Delivery Tercero" (Rappi, PedidosYa, Glovo, Otro)
- [ ] El costo de delivery se auto-llena correctamente
- [ ] Puede cambiar la sucursal de origen

### Configuración
- [ ] Puede editar tarifa Delivery Propio (default 3 soles)
- [ ] Puede editar tarifa Delivery Tercero (default 4 soles)
- [ ] Los cambios se reflejan en el POS

### RLS / Seguridad
- [ ] Las políticas RLS permiten acceso total al admin
- [ ] Puede ver datos de cualquier sucursal en todas las tablas

## Cómo Verificar RLS en Supabase

```sql
-- Verificar que el admin ve todos los datos
SET LOCAL request.jwt.claim.sub = '8b497abe-8b2b-4636-abab-91c7fc3c3fcd';
SET LOCAL request.jwt.claim.user_metadata = '{"display_name": "administrador"}';
SELECT * FROM ventas LIMIT 5;
```
