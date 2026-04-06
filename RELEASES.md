# DANI PIZZAS - Plan de Despliegues (Releases)

## Diagrama de Dependencias

```
R0 (Base) -> R1 (Auth) -> R2 (Layout) -> R3 (Dashboard)
                                       -> R4 (Productos) -> R5 (POS) -> R6 (Reportes)
                                                                     -> R7 (Promociones)
                                                                     -> R8 (Membresias)
                                       -> R9 (Sucursales) [paralelo con R10]
                                       -> R10 (Config)    [paralelo con R9]
                          R1 -> R11 (Usuarios)
```

## Checklist Pre-Commit (Aplica a TODOS los releases)

- [ ] `npm run build` pasa sin errores
- [ ] `npm run test:run` pasa (cuando aplique)
- [ ] No hay `any` en TypeScript
- [ ] Todos los textos UI en espanol
- [ ] Botones touch-friendly (h-12 minimo en POS)
- [ ] RLS verificado por rol (cuando aplique)

---

## Release 0: Arquitectura Base (Scaffolding)

**Estado:** [ ] Pendiente
**Objetivo:** Proyecto compilable con design system, clientes Supabase y DB lista.

### Commits esperados:
- [x] Inicializar proyecto Next.js con dependencias
- [ ] Configuraciones (tsconfig, next.config, postcss)
- [ ] Design system (globals.css con paleta DANI PIZZAS light + dark)
- [ ] Clientes Supabase (client.ts, server.ts, middleware.ts)
- [ ] Utilidades (utils.ts, constants.ts) y tipos base
- [ ] Root layout con ThemeProvider + Toaster
- [ ] Instalar shadcn/ui componentes base
- [ ] Migraciones DB (tablas, RLS, seed data)

### Criterio de exito:
- `npm run build` pasa sin errores
- Tablas creadas en Supabase con RLS habilitado
- 2 sucursales y 4 categorias insertadas como seed data

---

## Release 1: Login + Auth + Middleware

**Estado:** [x] Completado
**Dependencia:** Release 0
**Objetivo:** Autenticacion funcional con redireccion por rol.

### Commits esperados:
- [x] Middleware de autenticacion y proteccion de rutas
- [x] Pagina de login con formulario
- [x] Server Actions de auth (login, logout)
- [x] Sistema de permisos RBAC (permissions.ts, roles.ts)
- [x] Validaciones Zod para auth
- [x] Callback route para OAuth
- [x] Paginas placeholder para rutas protegidas
- [x] Pagina "Olvide mi contrasena" (envio de enlace de reset)
- [x] Pagina de reset de contrasena (nueva contrasena)
- [x] Manejo de sesion expirada (redireccion con mensaje)

### Criterio de exito:
- Login con email/password funciona
- Redireccion por rol correcta (admin->dashboard, mesero->pos, etc.)
- Rutas protegidas redirigen a /login sin sesion
- Rutas no permitidas redirigen a la primera ruta permitida del rol
- Flujo "Olvide mi contrasena" envia email y permite resetear
- Sesion expirada redirige a /login con aviso

---

## Release 2: Layout Principal (Sidebar + Header)

**Estado:** [ ] Pendiente
**Dependencia:** Release 1
**Objetivo:** Estructura visual del backoffice con navegacion por rol.

### Commits esperados:
- [ ] Layout del dashboard con sidebar + header
- [ ] Sidebar con navegacion filtrada por rol
- [ ] Header con info de usuario, sucursal y logout
- [ ] Componentes shared (page-header, sucursal-selector)
- [ ] Hooks (use-user, use-sucursal)
- [ ] Auth provider

### Criterio de exito:
- Sidebar muestra solo items permitidos por rol
- Header muestra nombre, rol y sucursal del usuario
- Layout responsive (sidebar colapsable en mobile/tablet)
- Selector de sucursal visible solo para admin

---

## Release 3: Dashboard

**Estado:** [ ] Pendiente
**Dependencia:** Release 2
**Objetivo:** Pagina principal con metricas del dia.

### Commits esperados:
- [ ] Pagina de dashboard con widgets
- [ ] Componentes: ventas-hoy, grafico de ventas, resumen sucursal, pedidos recientes
- [ ] Servicio de reportes (agregaciones basicas)
- [ ] Filtro por sucursal (admin)

### Criterio de exito:
- Dashboard renderiza correctamente (con estado vacio si no hay ventas)
- Admin puede filtrar por sucursal
- Cajero solo ve datos de su sucursal

---

## Release 4: Gestion de Productos (CRUD)

**Estado:** [ ] Pendiente
**Dependencia:** Release 2
**Objetivo:** Admin puede gestionar productos y categorias.

### Commits esperados:
- [ ] Listado de productos con tabla paginada
- [ ] Formulario de crear/editar producto
- [ ] CRUD de categorias
- [ ] Server Actions + servicio de productos
- [ ] Validaciones Zod
- [ ] Componentes shared (data-table, confirm-dialog, empty-state)

### Criterio de exito:
- CRUD completo de productos y categorias
- Validacion Zod funcional con mensajes en espanol
- Solo admin puede acceder a /productos
- Otros roles son redirigidos

---

## Release 5: POS (Punto de Venta) - CRITICO

**Estado:** [ ] Pendiente
**Dependencia:** Release 4
**Objetivo:** Punto de venta completo con 3 tipos de pedido.

### Commits esperados:
- [ ] Catalogo de productos (grid touch-friendly)
- [ ] Carrito dinamico con cantidades
- [ ] Selector de tipo de pedido (en local, para llevar, delivery)
- [ ] Formulario de delivery (metodo, repartidor/tercero, direccion, tarifa)
- [ ] Formulario de pago
- [ ] Resumen y confirmacion de pedido
- [ ] Server Actions + servicios de ventas y delivery
- [ ] Hooks (use-carrito, use-delivery-fees)

### Criterio de exito:
- Flujo completo de venta para los 3 tipos de pedido
- Delivery: seleccion de repartidor (propio) o tercero
- Tarifas auto-llenadas desde delivery_fees_config (editables)
- Mesero NO ve opcion de delivery
- Repartidor solo ve sus deliveries asignados
- Touch-friendly con botones h-14

---

## Release 6: Reportes

**Estado:** [ ] Pendiente
**Dependencia:** Release 5
**Objetivo:** Analytics de ventas con filtros avanzados.

### Commits esperados:
- [ ] Pagina de reportes con filtros
- [ ] Reporte de ventas (por fecha, sucursal, tipo pedido)
- [ ] Reporte de delivery (costos, tiempos, repartidores)
- [ ] Reporte por sucursal (rendimiento comparativo)
- [ ] Ampliar servicio de reportes

### Criterio de exito:
- Filtros por rango de fecha, sucursal, tipo de pedido
- Cajero solo ve reportes de su sucursal
- Graficos de rendimiento

---

## Release 7: Promociones

**Estado:** [ ] Pendiente
**Dependencia:** Release 4
**Objetivo:** CRUD de promociones con vinculacion a productos.

### Commits esperados:
- [ ] Listado de promociones
- [ ] Formulario de crear/editar promocion
- [ ] Vinculacion de productos a promociones
- [ ] Server Actions + servicio de promociones
- [ ] Integracion con POS (promociones activas)

### Criterio de exito:
- CRUD completo con fechas inicio/fin
- Promociones activas aparecen en el POS
- Solo admin puede gestionar promociones

---

## Release 8: Membresias y Programa de Puntos

**Estado:** [ ] Pendiente
**Dependencia:** Release 5
**Objetivo:** Gestion de niveles de membresia y reglas de puntos.

### Commits esperados:
- [ ] Gestion de niveles de membresia
- [ ] Configuracion de reglas de puntos
- [ ] Integracion basica con POS (aplicar descuentos por nivel)

### Criterio de exito:
- CRUD de niveles y reglas de puntos
- Calculo correcto de puntos por venta
- Solo admin puede gestionar

---

## Release 9: Gestion de Sucursales

**Estado:** [ ] Pendiente
**Dependencia:** Release 2
**Objetivo:** Admin puede editar datos de sucursales.
**Nota:** Puede ejecutarse en paralelo con Release 10.

### Commits esperados:
- [ ] Listado de sucursales
- [ ] Formulario de editar sucursal
- [ ] Server Actions + servicio de sucursales

### Criterio de exito:
- CRUD de sucursales con validacion
- Solo admin puede acceder

---

## Release 10: Configuracion (Tarifas Delivery)

**Estado:** [ ] Pendiente
**Dependencia:** Release 2
**Objetivo:** Admin puede editar tarifas de delivery por sucursal.
**Nota:** Puede ejecutarse en paralelo con Release 9.

### Commits esperados:
- [ ] Pagina de configuracion
- [ ] Formulario de tarifas por sucursal y tipo (propio/tercero)
- [ ] Server Actions + servicio de configuracion

### Criterio de exito:
- Tarifas editables por sucursal
- Cambios se reflejan en el POS
- Solo admin puede acceder

---

## Release 11: Gestion de Usuarios

**Estado:** [ ] Pendiente
**Dependencia:** Release 1
**Objetivo:** Admin puede gestionar usuarios con roles y sucursales.

### Commits esperados:
- [ ] Listado de usuarios
- [ ] Formulario de crear/editar usuario
- [ ] Asignacion de rol y sucursal
- [ ] Service role client (admin.ts) para crear usuarios
- [ ] Proteccion: no eliminar ultimo administrador
- [ ] Cambiar contrasena propia (disponible para todos los roles)
- [ ] Editar perfil propio (nombre)

### Criterio de exito:
- CRUD de usuarios con roles (administrador, cajero, mesero, repartidor)
- Asignacion de sucursal
- No se puede eliminar el ultimo admin
- Solo admin puede acceder al CRUD de usuarios
- Cualquier usuario puede cambiar su propia contrasena
- Cualquier usuario puede editar su nombre

---

## Sub-Agentes del Proyecto

| Agente | Responsabilidad | Directorios |
|--------|----------------|-------------|
| DB Agent | Migraciones, RLS, seed, tipos DB | `supabase/`, `types/database.ts` |
| UI Agent | Paginas, componentes, shadcn, responsive | `app/`, `components/` |
| Backend Agent | Actions, servicios, Zod, middleware, hooks | `actions/`, `lib/`, `hooks/`, `types/` |
| QA Agent | Tests, verificacion build, permisos | `tests/` |
| DevOps Agent | Configs, dependencias, deploy | Archivos raiz |

### Secuencia por Release
```
DB Agent -> Backend Agent -> UI Agent -> QA Agent -> Commit
```
