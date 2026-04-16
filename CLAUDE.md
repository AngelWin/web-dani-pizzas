# DANI PIZZAS - Panel de Administración Web

## Descripción del Proyecto

Panel de Administración Web (Backoffice + POS integrado) para **DANI PIZZAS**.

**App Name:** DANI PIZZAS  
**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui  
**Backend:** Supabase (Auth + DB + RLS)  
**Deploy:** Vercel  
**Idioma:** Español (Perú)

## Sucursales

- Casma Av. Reina
- Villa Hermosa Calle Uno

## Roles de Usuario

El rol de cada usuario se almacena en `auth.users.raw_user_meta_data->>'display_name'` y debe sincronizarse en la tabla `profiles`.

| Rol (display_name) | Permisos |
|--------------------|----------|
| `administrador` | Acceso total |
| `cajero` | POS + reportes básicos |
| `mesero` | POS (tomar todos los pedidos) |
| `repartidor` | Solo ver sus deliveries asignados |

> Al crear la tabla `profiles`, leer el rol desde `auth.users.raw_user_meta_data->>'display_name'` para sincronizar.

## Rutas Principales

| Ruta | Descripción |
|------|-------------|
| `/login` | Autenticación con Supabase Auth |
| `/forgot-password` | Solicitar enlace para resetear contraseña |
| `/reset-password` | Establecer nueva contraseña |
| `/dashboard` | Ventas del día, gráficos, filtro por sucursal |
| `/pos` | Punto de venta tactil-friendly |
| `/productos` | Gestión de productos |
| `/promociones` | Promociones con fecha inicio/fin |
| `/membresias` | Membresías y programa de puntos |
| `/reportes` | Reportes con filtro por delivery y sucursal |
| `/sucursales` | Gestión de sucursales |
| `/configuracion` | Tarifas de delivery y ajustes generales |

## Lógica de Delivery (POS)

Al elegir **Tipo de pedido = Delivery** en el POS:

- **Método:** Propio o Tercero
- **Si es Propio:** seleccionar repartidor de la sucursal
- **Si es Tercero:** seleccionar o escribir nombre (Rappi, PedidosYa, Glovo, Otro)
- **Costo de delivery (auto-llenado, editable):**
  - Propio → 3 soles (default)
  - Tercero → 4 soles (default)
- **Dirección completa** de entrega + referencia
- **Sucursal de origen:** automática según dónde se registra la venta
- **Estado del delivery:** Pendiente / En camino / Entregado (con timestamp)

Las tarifas se obtienen desde Supabase tabla `delivery_fees_config` y son editables por el Admin en `/configuracion`.

## Design System

### Colores

```
Primary:       #E53935  (Rojo pizza)
Primary Dark:  #C62828
Secondary:     #333333  (Gris oscuro)
Accent:        #FF7043  (Naranja suave)
Background:    #F5F5F5
Surface:       #FFFFFF
Border:        #E0E0E0
Text Primary:  #212121
Text Secondary:#757575
Text Light:    #FFFFFF
Success:       #4CAF50
Warning:       #FFB300
Error:         #E53935
Info:          #2196F3
```

### UI

- Border radius: 12px (cards, inputs)
- Shadow: `0 4px 12px rgba(0,0,0,0.08)`
- Soporte Dark Mode
- Contraste accesible (WCAG AA)
- Botones grandes para interacción táctil
- Sidebar con logo DANI PIZZAS
- Totalmente responsive (POS optimizado para tablet/PC táctil)

### Iconos

Usar `lucide-react` para todos los iconos.

## Estructura de Base de Datos (Supabase)

### Tablas

- `sucursales`
- `profiles` (role + sucursal_id)
- `productos`
- `promociones`
- `membresias_niveles`
- `reglas_puntos`
- `ventas` (tipo_pedido, delivery_method, delivery_fee, delivery_address, repartidor_id, third_party_name, sucursal_origen_id, delivery_status)
- `delivery_fees_config` (tarifas fijas por sucursal)

### Seguridad

- RLS (Row Level Security) estricto en **todas** las tablas
- Filtro multi-sucursal en todas las queries
- Los cajeros solo ven datos de su sucursal
- Los repartidores solo ven sus deliveries asignados

## Convenciones de Código

- Usar **Server Actions** de Next.js para mutations
- Usar **Supabase JS client** para queries
- Componentes en `/components`, páginas en `/app`
- Tipado estricto con TypeScript (no usar `any`)
- Formularios con `react-hook-form` + `zod` para validación
- Todos los textos de UI en español

## Estrategia de Despliegue: Git + Supabase

### Ambientes

| Git Branch | Supabase | Vercel | Uso |
|------------|----------|--------|-----|
| `develop` | DB-DANI-PIZZAS-QA (`vqezmbpyajoapybykhue`) | Preview | Desarrollo y pruebas |
| `main` | DB-DANI-PIZZAS (`tdmpzdssbxewbuosldof`) | Production | Producción real |

### Regla de oro

> **Nunca aplicar una migración directamente a PROD sin haberla probado antes en QA.**

Todo cambio de base de datos viaja primero a QA. PROD solo recibe lo que ya fue validado.

### Flujo completo de un PR develop → main

Cuando el usuario pide hacer un PR de `develop` a `main`, seguir este proceso **siempre**:

#### 1. Comparar migraciones pendientes

Usar `mcp__supabase__list_migrations` en ambas bases y determinar qué migraciones están en QA pero no en PROD:

```
QA migrations  → [A, B, C, D, E]
PROD migrations→ [A, B, C]
Pendientes     → [D, E]  ← aplicar a PROD
```

#### 2. Aplicar migraciones pendientes a PROD

Usar `mcp__supabase__apply_migration` con `project_id: tdmpzdssbxewbuosldof` para cada migración pendiente, en el mismo orden en que aparecen en QA.

#### 3. Verificar que PROD quedó sincronizado

Volver a comparar las listas — deben tener los mismos nombres de migración al final.

#### 4. Crear el PR en GitHub

```bash
git push origin develop
gh pr create --base main --head develop \
  --title "..." \
  --body "..."
```

#### Checklist de PR (siempre verificar antes de crear)

- [ ] `npm run build` pasa sin errores en `develop`
- [ ] Migraciones pendientes aplicadas a PROD
- [ ] Listas de migraciones QA y PROD sincronizadas
- [ ] CHANGELOG.md actualizado con la nueva versión
- [ ] RELEASES.md con tareas marcadas como `[x]`

### Convención para nombrar migraciones

Usar nombres descriptivos con prefijo de release cuando aplique:

```
r39_realtime_replica_identity       ← feature de un release
fix_rls_mesas_cajero_update         ← corrección de bug
add_columna_xxx_a_tabla_yyy         ← cambio estructural
```

### Lo que NO usar

**Supabase Branching nativo** requiere plan Pro (~$25/mes por branch). Esta estrategia manual es equivalente y gratuita.

## Variables de Entorno

Ver `.env.example` en la raíz del proyecto.

```env
NEXT_PUBLIC_SUPABASE_URL=https://tdmpzdssbxewbuosldof.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_oe_NtBfX_gjku6qOEayp_Q_OuMFp3-V
```
