# DANI PIZZAS - Plan de Despliegues (Releases)

## Diagrama de Dependencias

```
R0 (Base) -> R1 (Auth) -> R2 (Layout) -> R3 (Dashboard)
                                       -> R4 (Productos) -> R4.1 (Variantes + Disponibilidad)
                                                                     -> R5a (POS: Crear Orden)
                                                                     -> R5b (Gestion de Ordenes)
                                                                     -> R5c (Cobro de Orden)
                                                                          -> R5d (Historial de Estados)
                                                                               -> R6 (Reportes)
                                                                          -> R7 (Promociones)
                                                                          -> R8 (Membresias)
                                       -> R9 (Sucursales) [paralelo con R10]
                                       -> R10 (Config: Tarifas + Modelo Negocio)
                                            -> R12 (Servicios Delivery + Detalles Repartidor)
                                            -> R13 (Config: Moneda/Divisa Global)
                                            -> actualiza comportamiento visual de R5b y R5c
                          R1 -> R11 (Usuarios)
                                    -> R12 (campos repartidor en formulario usuarios)
R14 (Optimizaciones Rendimiento) [transversal, sin dependencias]
R9 (Sucursales) + R5a (POS) + R5b/R5c (Ordenes) -> R15 (Gestion de Mesas)
                                                        -> R16 (Reservas de Mesas) [pendiente]
R7 (Promociones) + R9 (Sucursales) + R5a (POS) -> R17 (Promociones Mejoradas)
                                                        -> R17.2 (Descuento Auto por Producto)
                                                        -> R18 (Promos por Membresia)
                                                        -> R19 (Promos en POS: Venta y Visualizacion)
                                                             -> R19.1 (Combo con Configurador Pizza)
R8 (Membresias) + R17 -> R21 (Membresia Auto al Crear Orden)
R8 (Membresias) -> R22 (Sistema de Membresias Completo)
R15 (Mesas) + R5b/R5c (Ordenes/Cobro) -> R20 (Cuenta de Mesa y Cobro Agrupado)
R5c (Cobro) + R9 (Sucursales) + R11 (Usuarios) -> R23 (Sesiones de Caja + Pedidos Programados) [pendiente]

[Auditoría de Código — sin dependencias funcionales, pueden ejecutarse en cualquier orden]
R27 (Seguridad Actions) -> BLOQUEANTE, ejecutar primero
R28 (Calidad Servicios) [transversal]
R29 (Arquitectura Capas) [transversal]
R30 (Refactor Componentes) [transversal]
R31 (Tipos y Dominio) [transversal, post-R27]

[Auditoría UI/UX — ejecutar por prioridad, todos son transversales]
R32 (Touch Targets + Tablas) -> CRÍTICO, ejecutar primero
R33 (Touch-Friendly Controls) -> post-R32
R34 (Design Tokens) [transversal]
R35 (Atomic Design) [transversal]
R36 (Refinamientos Layout) [transversal, bajo riesgo]
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

**Estado:** [x] Completado
**Objetivo:** Proyecto compilable con design system, clientes Supabase y DB lista.

### Commits esperados:
- [x] Inicializar proyecto Next.js con dependencias
- [x] Configuraciones (tsconfig, next.config, postcss)
- [x] Design system (globals.css con paleta DANI PIZZAS light + dark)
- [x] Clientes Supabase (client.ts, server.ts, middleware.ts)
- [x] Utilidades (utils.ts, constants.ts) y tipos base
- [x] Root layout con ThemeProvider + Toaster
- [x] Instalar shadcn/ui componentes base
- [x] Migraciones DB (tablas, RLS, seed data)

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

**Estado:** [x] Completado
**Dependencia:** Release 1
**Objetivo:** Estructura visual del backoffice con navegacion por rol.

### Commits esperados:
- [x] Layout del dashboard con sidebar + header
- [x] Sidebar con navegacion filtrada por rol
- [x] Header con info de usuario, sucursal y logout
- [x] Componentes shared (page-header, sucursal-selector)
- [x] Hooks (use-user, use-sucursal)
- [x] Auth provider

### Criterio de exito:
- Sidebar muestra solo items permitidos por rol
- Header muestra nombre, rol y sucursal del usuario
- Layout responsive (sidebar colapsable en mobile/tablet)
- Selector de sucursal visible solo para admin

---

## Release 3: Dashboard

**Estado:** [x] Completado
**Dependencia:** Release 2
**Objetivo:** Pagina principal con metricas del dia.

### Commits esperados:
- [x] Pagina de dashboard con widgets
- [x] Componentes: ventas-hoy, grafico de ventas, resumen sucursal, pedidos recientes
- [x] Servicio de reportes (agregaciones basicas)
- [x] Filtro por sucursal (admin)

### Criterio de exito:
- Dashboard renderiza correctamente (con estado vacio si no hay ventas)
- Admin puede filtrar por sucursal
- Cajero solo ve datos de su sucursal

---

## Release 4: Gestion de Productos (CRUD)

**Estado:** [x] Completado
**Dependencia:** Release 2
**Objetivo:** Admin puede gestionar productos y categorias.

### Commits esperados:
- [x] Listado de productos con tabla paginada
- [x] Formulario de crear/editar producto
- [x] CRUD de categorias
- [x] Server Actions + servicio de productos
- [x] Validaciones Zod
- [x] Componentes shared (data-table, confirm-dialog, empty-state)

### Criterio de exito:
- CRUD completo de productos y categorias
- Validacion Zod funcional con mensajes en espanol
- Solo admin puede acceder a /productos
- Otros roles son redirigidos

---

## Release 4.1: Variantes de Producto y Disponibilidad por Sucursal

**Estado:** [x] Completado
**Dependencia:** Release 4
**Objetivo:** Extender el catalogo de productos con medidas/tamaños por categoria y disponibilidad por sucursal. Prerrequisito obligatorio del POS.

### Contexto del negocio:
- Las pizzas tienen 5 tamaños (Mini, Personal, Mediana, Familiar, Extra) cada una con precio distinto
- Las bebidas (chicha, limonada, jugos) tienen medidas por volumen (Vaso, 500ml, 1L, 1.5L)
- Las gaseosas tambien tienen medidas (Personal, Mediana, Familiar, Extra)
- Los postres pueden tener medidas (Por tajada, Entero) o venderse por unidad
- Otros productos como gelatinas, mazamorras se venden por unidad sin medida
- No todos los productos estan disponibles en todas las sucursales

### Nuevas tablas DB:

**`categoria_medidas`** — Medidas predefinidas por categoria (se gestionan como las categorias)
```
id, categoria_id, nombre (ej: "Mini", "Familiar", "Vaso", "1.5 litros"), descripcion, orden, activa
```

**`producto_variantes`** — Precio de cada medida para cada producto
```
id, producto_id, medida_id, precio, disponible, orden
```
- Si el producto tiene variantes → precio vive aqui (productos.precio queda en null)
- Si el producto no tiene variantes (gelatina, mazamorra) → usa productos.precio base

**`producto_sucursal`** — Disponibilidad por sucursal
```
id, producto_id, sucursal_id, disponible
```

### Cambios en tablas existentes:
- `productos.precio` → se vuelve nullable (solo para productos sin variantes)
- `venta_items` → agregar `variante_id` (nullable) y `variante_nombre` (texto historico)

### Commits esperados:
- [x] Migracion DB: tablas categoria_medidas, producto_variantes, producto_sucursal
- [x] Migracion DB: ajustes en productos y venta_items
- [x] RLS para las 3 nuevas tablas
- [x] Tipos TypeScript actualizados
- [x] Seccion "Medidas por Categoria" en /productos (backoffice)
- [x] Formulario de producto actualizado: variantes con precio por medida
- [x] Formulario de producto actualizado: checkboxes de disponibilidad por sucursal
- [x] Server Actions y servicios actualizados
- [x] Validaciones Zod actualizadas

### Criterio de exito:
- Admin puede definir medidas para cada categoria (ej: Pizzas → Mini, Personal, Mediana, Familiar, Extra)
- Al crear/editar un producto con categoria que tiene medidas → se ingresan precios por medida
- Al crear/editar un producto sin medidas → se ingresa un precio base como antes
- Admin puede marcar que sucursales tienen disponible cada producto
- El POS puede consultar variantes y disponibilidad por sucursal correctamente

---

## Release 4.2: Sabores, Combinaciones y Extras para Pizzas

**Estado:** [x] Completado
**Dependencia:** Release 4.1
**Objetivo:** Extender el modelo de productos para soportar sabores de pizza (con ingredientes y exclusiones), combinaciones multi-sabor en tamaños especificos, y extras pagados por categoria.

### Contexto del negocio:
- Las pizzas tienen sabores (Americana, Hawaiana, Marina, etc.) como dimension independiente del producto
- En tamaños Familiar y Extra se permiten hasta 3 sabores combinados (mitad/mitad o tercios)
- Cada sabor tiene ingredientes registrados para permitir exclusiones ("sin piña")
- Se pueden agregar extras pagados a la pizza (Extra Queso, Champiñones, etc.)
- Otros productos (bebidas, postres, lasagna, gelatinas) no cambian: siguen el modelo anterior

### Nuevas tablas DB:

**`pizza_sabores`** — Sabores de pizza por categoria
```
id, categoria_id, nombre, descripcion, imagen_url, disponible, orden, created_at, updated_at
```

**`sabor_ingredientes`** — Ingredientes por sabor (para gestionar exclusiones)
```
id, sabor_id, nombre, es_principal, orden
```

**`producto_extras`** — Extras pagados por categoria
```
id, categoria_id, nombre, precio, disponible, orden, created_at, updated_at
```

### Cambios en tablas existentes:
- `categoria_medidas` → agregar `permite_combinacion boolean DEFAULT false`
- `orden_items` → agregar `sabores jsonb` y `extras jsonb`

### Estructura JSON en orden_items:

`sabores`:
```json
[
  { "sabor_id": "uuid", "sabor_nombre": "Hawaiana", "proporcion": "1/2", "exclusiones": ["Piña"] },
  { "sabor_id": "uuid", "sabor_nombre": "Americana", "proporcion": "1/2", "exclusiones": [] }
]
```

`extras`:
```json
[
  { "extra_id": "uuid", "nombre": "Extra Queso", "precio": 2.00 }
]
```

### Commits esperados:
- [x] Migracion DB: tablas pizza_sabores, sabor_ingredientes, producto_extras
- [x] Migracion DB: permite_combinacion en categoria_medidas, sabores/extras en orden_items
- [x] RLS para las 3 nuevas tablas
- [x] Tipos TypeScript actualizados (database.ts, lib/services/productos.ts)
- [x] Servicios CRUD en lib/services/productos.ts (sabores, ingredientes, extras)
- [x] Server Actions en actions/productos.ts
- [x] Validaciones Zod actualizadas (lib/validations/ordenes.ts, lib/validations/productos.ts)
- [x] Hook use-carrito.ts extendido con SaborOrden, ExtraOrden, agregarPizza, key unica
- [x] Backoffice /productos: toggle permite_combinacion en medidas
- [x] Backoffice /productos: nueva seccion SaboresSection (CRUD sabores + ingredientes)
- [x] Backoffice /productos: nueva seccion ExtrasSection (CRUD extras)
- [x] POS: ConfiguradorProductoDialog (selector multi-paso: tamaño → sabores → exclusiones/extras)
- [x] POS: catalogo-productos detecta categorias con sabores y abre configurador
- [x] POS: carrito muestra desglose de sabores, exclusiones y extras
- [x] POS: crearOrdenAction y crearOrden persisten sabores y extras en orden_items
- [x] Ordenes: tarjeta-orden muestra desglose de pizza (proporciones, exclusiones, extras)

### Criterio de exito:
- Admin puede definir sabores con ingredientes para categorias de pizza
- Admin puede marcar medidas Familiar y Extra como combinables
- Admin puede definir extras pagados por categoria
- En POS, al tocar una pizza → se abre ConfiguradorProductoDialog
- Se puede seleccionar 1 sabor (Personal/Mediana) o hasta 3 sabores (Familiar/Extra)
- Se pueden excluir ingredientes por sabor
- Se pueden agregar extras pagados; el precio se suma al subtotal
- Cada pizza configurada es un item independiente en el carrito (no se fusionan)
- En /ordenes, el detalle muestra proporciones, exclusiones y extras correctamente

---

## Release 5: POS (Punto de Venta) - CRITICO

> **Replanteado:** El flujo correcto para DANI PIZZAS separa la toma de pedido del cobro.
> La BD ya contempla esta arquitectura: tabla `ordenes` (pedido) → tabla `ventas` (cobro).
> R5 se divide en tres sub-releases: 5a (POS crea ordenes), 5b (gestion de ordenes), 5c (cobro).

---

## Release 5a: POS — Toma de Pedido (Crear Orden)

**Estado:** [x] Completado
**Dependencia:** Release 4.1
**Objetivo:** El POS registra ordenes en la tabla `ordenes` + `orden_items`. NO crea ventas directamente.

### Contexto del negocio:
- El cajero o mesero toma el pedido desde el POS
- El pedido queda registrado como orden con estado "confirmada"
- La cocina/staff lo prepara y actualiza el estado
- Solo cuando la orden esta lista se puede cobrar (Release 5c)

### Flujo del POS:
1. Seleccionar productos del catalogo (filtrado por sucursal)
2. Elegir medida/variante si aplica
3. Armar carrito con cantidades
4. Elegir tipo de pedido (en local, para llevar, delivery)
5. Si delivery: metodo, repartidor o tercero, direccion, tarifa
6. Confirmar → crea orden en estado "confirmada"
7. Pantalla de confirmacion con numero de orden

### Tabla destino: `ordenes` + `orden_items`
- `ordenes.estado`: inicia en "confirmada"
- `ordenes.cajero_id`, `sucursal_id`, `tipo_pedido`, campos delivery
- `orden_items`: producto_id, variante_id, cantidad, precios historicos

### Commits esperados:
- [x] Refactorizar actions/ventas.ts → actions/ordenes.ts (insert en ordenes + orden_items)
- [x] Servicio getOrdenesPOS, crearOrden en lib/services/ordenes.ts
- [x] Validaciones Zod actualizadas para orden (lib/validations/ordenes.ts)
- [x] Catalogo de productos filtrado por sucursal (reutilizar logica existente)
- [x] Selector de medida/variante al agregar producto
- [x] Carrito dinamico con cantidades
- [x] Formulario: tipo de pedido + delivery + notas
- [x] Confirmacion con numero de orden generado
- [x] Hooks: use-carrito (reutilizar), use-delivery-fees (reutilizar)
- [x] Mesero NO ve opcion delivery

### Criterio de exito:
- El POS crea registros en `ordenes` (no en `ventas`)
- Orden queda en estado "confirmada" al crearse
- Numero de orden autogenerado visible en confirmacion
- Delivery guarda repartidor/tercero, direccion y tarifa en la orden
- Mesero no ve opcion de delivery
- Touch-friendly con botones h-14

---

## Release 5b: Gestion de Ordenes

**Estado:** [x] Completado
**Dependencia:** Release 5a
**Objetivo:** Pagina /ordenes con lista de ordenes activas, cambio de estado y vista por rol.

### Flujo de estados de una orden:
```
confirmada → en_preparacion → lista → entregada
                                  ↘ cancelada (en cualquier punto)
```

### Vista por rol:
| Rol | Lo que ve |
|-----|-----------|
| Administrador | Todas las ordenes de la sucursal seleccionada |
| Cajero | Todas las ordenes de su sucursal |
| Mesero | Todas las ordenes de su sucursal (solo en local y para llevar) |
| Repartidor | Solo las ordenes de delivery asignadas a el |

### Commits esperados:
- [x] Pagina /ordenes con lista de ordenes activas (filtrada por sucursal y rol)
- [x] Tarjeta de orden: numero, tipo pedido, items resumidos, estado, tiempo transcurrido
- [x] Cambio de estado: confirmada → en_preparacion → lista (boton por estado)
- [x] Filtros: por estado, por tipo de pedido
- [x] Vista de detalle de orden (items completos, datos de delivery)
- [x] Boton "Cancelar orden" con confirmacion
- [x] Repartidor: ve solo sus ordenes delivery, puede marcar en_camino y entregado
- [x] Actualizacion de delivery_status al marcar entregado (con timestamp)
- [x] Server Actions: actualizarEstadoOrden, cancelarOrden
- [x] Servicio: getOrdenes (con filtros por sucursal, rol, estado)
- [x] Polling o recarga manual para ver nuevas ordenes

### Criterio de exito:
- Lista de ordenes activas visible y actualizable
- Estados cambian correctamente segun el flujo
- Repartidor solo ve y gestiona sus deliveries asignados
- Cancelacion con confirmacion
- Interfaz touch-friendly

---

## Release 5c: Cobro de Orden (Cierre de Venta)

**Estado:** [x] Completado
**Dependencia:** Release 5b
**Objetivo:** Desde una orden en estado "lista", el cajero procesa el cobro. Crea el registro en `ventas` vinculado a la orden.

### Flujo de cobro:
1. Orden en estado "lista" muestra boton "Cobrar"
2. Se abre formulario de pago (metodo de pago, monto recibido)
3. Al confirmar:
   - Crea registro en `ventas` con `orden_id` FK
   - `ventas.total` = subtotal + delivery_fee (si aplica)
   - `ventas.estado_pago_v2` = "pagado"
   - Actualiza `ordenes.estado` = "entregada"
4. Pantalla de confirmacion con numero de venta y vuelto (si es efectivo)

### Commits esperados:
- [x] Boton "Cobrar" visible solo en ordenes con estado "lista"
- [x] Dialog/pagina de cobro: metodo de pago, monto recibido, calculo de vuelto
- [x] Server Action: cobrarOrden (crea venta + actualiza orden)
- [x] Servicio: cobrarOrden en lib/services/ventas.ts
- [x] Validacion Zod para el cobro
- [x] Confirmacion con numero de venta, total cobrado y vuelto
- [x] Cajero y admin pueden cobrar; mesero y repartidor NO

### Criterio de exito:
- Solo ordenes en estado "lista" pueden cobrarse
- Venta queda vinculada a la orden (orden_id FK)
- Calculo correcto de vuelto para pagos en efectivo
- Estado de la orden pasa a "entregada" al cobrar
- Solo cajero y admin pueden realizar el cobro

---

## Release 5d: Historial de Estados de Orden (Auditoría)

**Estado:** [x] Completado
**Dependencia:** Release 5c
**Objetivo:** Registrar cada transicion de estado de una orden: quien la cambio, desde que estado, hacia cual y cuando. Habilita auditoria y reportes de eficiencia operativa.

### Contexto del negocio:
Actualmente los cambios de estado de una orden no dejan rastro. Esto impide saber:
- Cuanto tiempo estuvo una orden en preparacion
- Que usuario cambio un estado
- Si hubo estados revertidos o cancelaciones tardias

### Nueva tabla DB: `orden_estado_historial`

```
id            uuid PK
orden_id      uuid FK ordenes.id
estado_desde  estado_orden (nullable — null si es la creacion)
estado_hasta  estado_orden
cambiado_por  uuid FK profiles.id
cambiado_at   timestamptz DEFAULT now()
notas         text (nullable — para cancelaciones con motivo)
```

> No elimines ni modifiques registros del historial. Es append-only por diseno.

### Comportamiento:
- Insertar fila automaticamente en cada cambio de estado de orden
- El primer registro tiene `estado_desde = null` (orden recien creada en "confirmada")
- La cancelacion puede incluir un campo `notas` con el motivo
- RLS: todos los roles autenticados pueden leer; solo el sistema (via Server Action) puede insertar

### Metricas que habilita (para R6 Reportes):
- Tiempo promedio en preparacion (delta entre `en_preparacion` y `lista`)
- Tiempo total de ciclo de orden (creacion a entrega)
- Ordenes canceladas por turno y quien las cancelo
- Rendimiento por cajero/mesero

### Commits esperados:

**DB:**
- [x] Migracion: tabla `orden_estado_historial`
- [x] RLS: insert solo via service role o autenticado; select autenticado
- [x] Trigger automatico al INSERT (creacion) y UPDATE de ordenes.estado
- [x] Tipos TypeScript actualizados

**Backend:**
- [x] Funcion `getHistorialOrden` en lib/services/ordenes.ts
- [x] Tipo `HistorialConUsuario` con join a profiles
- [x] `OrdenConItems` incluye `orden_estado_historial` en el select de `getOrdenes`

**UI:**
- [x] Componente `HistorialTimeline` colapsable en tarjeta de orden
- [x] Cada entrada muestra: transicion de estado, usuario, hora, tiempo transcurrido desde el anterior

### Criterio de exito:
- Cada cambio de estado queda registrado con usuario y timestamp
- La creacion de la orden genera el primer registro del historial
- La cancelacion puede registrar un motivo
- El timeline es visible en la tarjeta de orden
- No se puede eliminar ni modificar el historial desde la UI

---

## Release 6: Reportes

**Estado:** [x] Completado
**Dependencia:** Release 5
**Objetivo:** Analytics de ventas con filtros avanzados.

### Commits esperados:
- [x] Pagina de reportes con filtros (rango de fecha, sucursal, tipo pedido)
- [x] Reporte de ventas: resumen cards (total, promedio, delivery, por tipo)
- [x] Grafico de ventas por dia (AreaChart con Recharts)
- [x] Grafico de distribucion por tipo de pedido (BarChart con porcentajes)
- [x] Top 10 productos mas vendidos con barra de progreso
- [x] Detalle de delivery (propio vs tercero, fees, promedios)
- [x] Rendimiento comparativo por sucursal (solo admin)
- [x] Tabla detalle de ventas (ultimas 50, con cajero, metodo pago, tipo)
- [x] Servicio `lib/services/reportes.ts` con todas las funciones de agregacion
- [x] Componente `FiltrosReporte` (client) con navegacion por URL
- [x] Cajero solo ve datos de su sucursal (sin selector de sucursal)

### Criterio de exito:
- Filtros por rango de fecha, sucursal, tipo de pedido funcionan correctamente
- Cajero solo ve reportes de su sucursal (sin opcion de cambiarla)
- Admin puede filtrar por cualquier sucursal o ver todas
- Graficos de rendimiento con Recharts
- Build pasa sin errores ni warnings de TypeScript

---

## Release 7: Promociones

**Estado:** [x] Completado
**Dependencia:** Release 4
**Objetivo:** CRUD de promociones con vinculacion a productos.

### Commits esperados:
- [x] Listado de promociones
- [x] Formulario de crear/editar promocion
- [x] Vinculacion de productos a promociones
- [x] Server Actions + servicio de promociones
- [x] Integracion con POS (promociones activas)

### Criterio de exito:
- CRUD completo con fechas inicio/fin
- Promociones activas aparecen en el POS
- Solo admin puede gestionar promociones

---

## Release 8: Membresias y Programa de Puntos

**Estado:** [x] Completado
**Dependencia:** Release 5
**Objetivo:** Gestion de niveles de membresia y reglas de puntos.

### Commits esperados:
- [x] Gestion de niveles de membresia
- [x] Configuracion de reglas de puntos
- [x] Integracion basica con POS (aplicar descuentos por nivel)

### Criterio de exito:
- CRUD de niveles y reglas de puntos
- Calculo correcto de puntos por venta
- Solo admin puede gestionar

---

## Release 9: Gestion de Sucursales

**Estado:** [x] Completado
**Dependencia:** Release 2
**Objetivo:** Admin puede editar datos de sucursales.
**Nota:** Puede ejecutarse en paralelo con Release 10.

### Commits esperados:
- [x] Listado de sucursales (cards con dirección, teléfono, estado activa)
- [x] Formulario de editar sucursal (nombre, dirección, teléfono, activa)
- [x] Server Actions + servicio de sucursales
- [x] Validaciones Zod

### Criterio de exito:
- CRUD de sucursales con validacion
- Solo admin puede acceder

---

## Release 10: Configuracion (Tarifas Delivery + Modelo de Negocio)

**Estado:** [x] Completado
**Dependencia:** Release 2 (configuracion base) + Release 5c (afecta comportamiento visual de ordenes/POS)
**Objetivo:** Admin puede editar tarifas de delivery y elegir el modelo de operacion del negocio.
**Nota:** Puede ejecutarse en paralelo con Release 9.

### Contexto del negocio:
El modelo de operacion define como fluyen los estados de una orden en la interfaz.
Internamente los estados de BD nunca cambian; solo cambia que transiciones y botones
se muestran segun el modo seleccionado.

### Modelos de operacion:

**Modo Simple** (negocio pequeno, sin cocina separada):
```
confirmada → en_preparacion → entregada
("lista" se omite visualmente — el cajero cobra directo desde en_preparacion)
```

**Modo Cocina Independiente** (cocina y caja operan separadas):
```
confirmada → en_preparacion → lista → entregada
(cocina marca "lista", cajero ve la orden lista y procede a cobrar)
```

> Regla de oro: los estados en BD siempre son los mismos. Solo cambia el comportamiento visual.

### Reglas de edicion de orden:

Una orden es editable solo si:
- `estado IN (confirmada, en_preparacion)` Y
- `estado_pago = pendiente`

Bloqueada absolutamente si:
- `estado_pago = pagado`
- `estado IN (lista, entregada, cancelada)`

Se muestra advertencia visual al editar una orden en estado `en_preparacion`
(puede estar siendo preparada en cocina).

### Nueva tabla DB: `configuracion_negocio`

```
id (siempre un registro unico global)
modelo_negocio: simple | cocina_independiente
updated_at
updated_by (auth.uid)
```

> No hay config por sucursal — el modelo aplica a todo el negocio.

### Commits esperados:

**DB:**
- [x] Migracion: tabla `configuracion_negocio` con fila unica global
- [x] RLS: solo admin puede update; todos pueden select
- [x] Seed: insertar fila inicial con modelo `simple`
- [x] Tipos TypeScript actualizados (generate types)

**Backend:**
- [x] Servicio `lib/services/configuracion.ts`: getConfiguracion, updateConfiguracion, getDeliveryFees, updateDeliveryFees
- [x] Server Actions `actions/configuracion.ts`: actualizarModelo, actualizarTarifas
- [x] Validaciones Zod para ambos formularios

**UI — Pagina /configuracion:**
- [x] Seccion "Modelo de operacion": selector visual (cards radio) con descripcion de cada modo
- [x] Seccion "Tarifas de delivery": formulario por sucursal (propio/tercero) — tarifa actual y nueva
- [x] Solo admin puede acceder y editar

**Integracion con /ordenes y POS:**
- [x] Leer `modelo_negocio` en servidor y pasarlo como prop a `ListaOrdenes` y `PosClient`
- [x] En Modo Simple: ocultar boton "Marcar lista", habilitar cobro directo desde `en_preparacion`
- [x] En Modo Cocina: mostrar flujo completo incluyendo estado `lista`
- [x] Bloquear edicion de orden segun reglas definidas (estados finalizados sin acciones)
- [x] Advertencia visual al intentar cancelar orden en `en_preparacion` (icono AlertTriangle + color amber)

### Criterio de exito:
- Admin puede cambiar el modelo de operacion desde /configuracion
- Cambio se refleja inmediatamente en /ordenes y el POS (sin deploy)
- Tarifas de delivery editables por sucursal y tipo
- Los cambios de tarifas se reflejan en el POS
- Estados internos en BD nunca se alteran segun el modelo elegido
- Reglas de edicion de orden aplicadas correctamente por estado y estado_pago
- Solo admin puede acceder a /configuracion

---

## Release 11: Gestion de Usuarios

**Estado:** [x] Completado
**Dependencia:** Release 1
**Objetivo:** Admin puede gestionar usuarios con roles y sucursales.

### Commits esperados:
- [x] Listado de usuarios con tabla (nombre, correo, rol, sucursal, estado)
- [x] Formulario de crear usuario (email, password, nombre, rol, sucursal)
- [x] Formulario de editar usuario (nombre, rol, sucursal, estado)
- [x] Asignacion de rol y sucursal
- [x] Service role client (lib/supabase/admin.ts) para crear/eliminar en auth
- [x] Proteccion: no eliminar ultimo administrador
- [x] Rutas /usuarios y /perfil agregadas al sistema de permisos
- [x] /usuarios solo accesible para administrador (redirect si no es admin)
- [x] /perfil accesible para todos los roles
- [x] Pagina /perfil: editar nombre y cambiar contrasena
- [x] Enlace "Mi perfil" en el dropdown del header (todos los roles)
- [x] Server Actions: crear, actualizar, eliminar usuario, cambiar contrasena, actualizar nombre

### Criterio de exito:
- CRUD de usuarios con roles (administrador, cajero, mesero, repartidor)
- Asignacion de sucursal
- No se puede eliminar el ultimo admin
- Solo admin puede acceder al CRUD de usuarios
- Cualquier usuario puede cambiar su propia contrasena
- Cualquier usuario puede editar su nombre

---

## Release 12: Servicios de Delivery + Detalles de Repartidor

**Estado:** [x] Completado
**Dependencia:** Release 10 + Release 11
**Objetivo:** Mover servicios de delivery a la BD (gestionables desde /configuracion), cada uno con su precio por sucursal, y agregar detalles de repartidor (direccion, tipo de vehiculo) al formulario de usuarios.

### Contexto del negocio:
- Los servicios de delivery (Rappi, PedidosYa, Glovo, etc.) estaban hardcodeados en constantes
- Las tarifas vivian en `delivery_fees_config` con solo 2 filas por sucursal (propio/tercero)
- El admin no podia agregar ni editar servicios desde la UI
- Los repartidores no tenian campos para direccion ni tipo de vehiculo

### Nuevas tablas DB:

**`delivery_servicios`** — Servicios de delivery por sucursal (reemplaza delivery_fees_config + THIRD_PARTY_SERVICES)
```
id, sucursal_id, nombre, tipo (propio|tercero), precio_base, activo, orden, created_at, updated_at
```

**`repartidor_detalles`** — Detalles 1:1 con profiles (solo para repartidores)
```
id (FK profiles CASCADE), direccion, tipo_vehiculo (text[]), notas, created_at, updated_at
```

### Commits esperados:

**DB:**
- [x] Migracion: tabla `delivery_servicios` con RLS (authenticated SELECT, admin ALL)
- [x] Migracion: datos de `delivery_fees_config` migrados a `delivery_servicios`
- [x] Migracion: tabla `repartidor_detalles` con RLS (admin ALL, repartidor SELECT own)
- [x] Tipos TypeScript regenerados

**Backend:**
- [x] Servicio `lib/services/delivery-servicios.ts`: CRUD completo
- [x] Servicio `lib/services/repartidor-detalles.ts`: get/upsert
- [x] Validaciones Zod: `lib/validations/delivery-servicios.ts`
- [x] Validaciones Zod: `lib/validations/usuarios.ts` extendido con repartidor_detalles
- [x] Server Actions `actions/delivery-servicios.ts`: CRUD con verificacion de rol admin
- [x] Server Actions `actions/usuarios.ts`: upsert repartidor_detalles al crear/editar
- [x] Hook `hooks/use-delivery-fees.ts` reescrito como `useDeliveryServicios`
- [x] Constantes: `TIPOS_VEHICULO` y `TIPOS_VEHICULO_LABELS` en `lib/constants.ts`
- [x] Limpieza: eliminadas constantes deprecadas `THIRD_PARTY_SERVICES` y `DEFAULT_DELIVERY_FEES`

**UI — /configuracion:**
- [x] Nuevo componente `DeliveryServiciosForm` (reemplaza tarifas-delivery-form)
- [x] Por sucursal: tabla de servicios (nombre, tipo badge, precio, toggle activo)
- [x] Dialog para agregar/editar servicio
- [x] Eliminar servicio con confirmacion

**UI — POS:**
- [x] `pos-client.tsx` usa `useDeliveryServicios` en vez de `useDeliveryFees`
- [x] `formulario-pedido-dialog.tsx` con selector dinamico de servicios terceros desde BD
- [x] Fee auto-llenado desde `precio_base` del servicio seleccionado

**UI — Usuarios:**
- [x] `usuario-form.tsx` con campos condicionales cuando rol = repartidor
- [x] Campos: direccion, tipo de vehiculo (checkboxes multi-select), notas
- [x] `usuarios-tabla.tsx` carga repartidor_detalles client-side al editar

### Criterio de exito:
- En /configuracion → seccion "Servicios de delivery" visible por sucursal
- Admin puede agregar, editar, activar/desactivar y eliminar servicios
- En /pos → crear pedido delivery tercero → selector dinamico con servicios activos
- Fee se auto-llena con precio_base del servicio seleccionado
- En /usuarios → crear/editar usuario repartidor → campos extra visibles
- Tipo de vehiculo soporta seleccion multiple (auto, motocar, moto lineal)
- Datos de repartidor persisten en `repartidor_detalles`

---

## Release 13: Configuracion de Moneda (Divisa Global)

**Estado:** [x] Completado
**Dependencia:** Release 10 (Configuracion base)
**Objetivo:** Permitir al admin configurar la moneda activa del negocio desde /configuracion, con soporte para monedas predefinidas (PEN, USD) y personalizadas. El simbolo se refleja en toda la app de forma centralizada.

### Contexto del negocio:
- Actualmente el simbolo `S/.` esta hardcodeado en `formatCurrency()` de `lib/utils.ts`
- El negocio opera en Peru pero puede expandirse a otros paises
- La moneda es **global** (no por sucursal): un negocio opera en una sola moneda
- Se necesita un punto centralizado para cambiar la moneda y que se refleje en POS, reportes, ordenes, productos, etc.

### Decisiones de diseno:
- **Global, no por sucursal** — un negocio opera en una sola moneda; si se expande a otro pais seria otra instancia
- **Backward compatible** — `formatCurrency` recibe simbolo opcional con fallback a `S/.`
- **CurrencyProvider** — provee el simbolo activo a todos los Client Components via React Context
- **Server Components** — reciben el simbolo como prop desde el layout (que hace fetch de la moneda activa)

### Nueva tabla DB: `monedas`

```
id            uuid PK DEFAULT gen_random_uuid()
codigo        text NOT NULL UNIQUE     -- 'PEN', 'USD', 'EUR'
simbolo       text NOT NULL            -- 'S/.', '$', '€'
nombre        text NOT NULL            -- 'Sol Peruano', 'Dolar Americano'
es_predefinida boolean NOT NULL DEFAULT false
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

### Cambios en tablas existentes:
- `configuracion_negocio` → agregar `moneda_activa_id uuid REFERENCES monedas(id)`

### Seed data:
- `('PEN', 'S/.', 'Sol Peruano', true)`
- `('USD', '$', 'Dolar Americano', true)`
- `configuracion_negocio.moneda_activa_id` → apunta a PEN por defecto

### RLS:
- SELECT: todos los usuarios autenticados
- INSERT/UPDATE/DELETE: solo administrador

### Commits esperados:

**DB:**
- [ ] Migracion: tabla `monedas` con seed PEN y USD
- [ ] Migracion: campo `moneda_activa_id` en `configuracion_negocio` con FK
- [ ] RLS: authenticated SELECT, admin ALL
- [ ] Tipos TypeScript actualizados (database.ts)

**Backend:**
- [ ] Servicio `lib/services/monedas.ts`: getMonedas, getMonedaActiva, createMoneda, updateMoneda, deleteMoneda, setMonedaActiva
- [ ] Validaciones Zod `lib/validations/moneda.ts`: monedaSchema, monedaActivaSchema
- [ ] Server Actions `actions/monedas.ts`: CRUD + setMonedaActiva (verificacion rol admin)
- [ ] Modificar `formatCurrency` en `lib/utils.ts`: agregar parametro `symbol` opcional (backward compatible)
- [ ] Funcion `getMonedaActivaParaLayout` en `lib/services/configuracion.ts` con fallback a S/./PEN

**Providers:**
- [ ] `components/providers/currency-provider.tsx`: CurrencyProvider con Context (simbolo, codigo, formatCurrency)
- [ ] `hooks/use-currency.ts`: re-export de useCurrency
- [ ] Integrar CurrencyProvider en `app/(dashboard)/layout.tsx` (fetch moneda activa + envolver AuthProvider)

**UI — /configuracion (nueva seccion "Moneda"):**
- [ ] Componente `components/configuracion/moneda-config-section.tsx`
- [ ] Sub-seccion A: Selector de moneda activa (cards clickeables tipo modelo-negocio-form)
- [ ] Sub-seccion B: Tabla de monedas personalizadas (agregar, editar, eliminar)
- [ ] Dialog de crear/editar moneda (react-hook-form + zod)
- [ ] Monedas predefinidas no eliminables (Badge "Predefinida")
- [ ] Actualizar `app/(dashboard)/configuracion/page.tsx` con nueva seccion

**Correccion de inconsistencias (hardcodes de simbolo de moneda):**
- [ ] `components/productos/productos-table.tsx:185` — usar formatCurrency con simbolo del hook
- [ ] `components/productos/producto-form.tsx:281,328` — labels con simbolo dinamico
- [ ] `components/productos/extras-section.tsx:102` — label con simbolo dinamico
- [ ] `components/pos/formulario-pedido-dialog.tsx:421,515` — labels con simbolo dinamico
- [ ] `components/ordenes/acciones-orden.tsx:186` — span con simbolo del hook
- [ ] `components/ordenes/cobro-dialog.tsx:296` — label con simbolo dinamico
- [ ] `components/configuracion/delivery-servicios-form.tsx:373` — label con simbolo dinamico
- [ ] `components/membresias/formulario-regla-dialog.tsx:117,133,173` — labels con simbolo dinamico
- [ ] `components/membresias/lista-membresias.tsx:376` — texto con simbolo dinamico
- [ ] `components/promociones/formulario-promocion-dialog.tsx:246` — SelectItem con simbolo dinamico
- [ ] `components/reportes/grafico-ventas-dia.tsx` — tickFormatter con simbolo del hook
- [ ] `components/reportes/grafico-ventas-tipo.tsx` — tickFormatter con simbolo del hook
- [ ] `components/dashboard/grafico-ventas-tipo.tsx` — tickFormatter con simbolo del hook

**Reglas:**
- [ ] Actualizar `.claude/rules/frontend.md` seccion "## Moneda" con nuevas reglas (usar useCurrency, nunca hardcodear)

### Criterio de exito:
- En /configuracion aparece seccion "Moneda" con PEN y USD como opciones predefinidas
- Admin puede seleccionar moneda activa y el cambio se refleja en toda la app
- Admin puede agregar monedas personalizadas (ej: EUR, €, Euro)
- No se pueden eliminar monedas predefinidas (PEN, USD)
- No se puede eliminar la moneda activa
- Todos los precios en POS, ordenes, reportes, productos, dashboard muestran el simbolo correcto
- `formatCurrency` sigue funcionando sin parametro (backward compatible con S/.)
- Build pasa sin errores

---

## Release 14: Optimizaciones de Rendimiento (Fase 1)

**Estado:** [x] Completado
**Dependencia:** Ninguna (transversal)
**Objetivo:** Optimizar rendimiento y resiliencia del proyecto en plan gratuito de Supabase + Vercel. Reducir consumo de Storage/bandwidth y prevenir pausa de la base de datos.

### Contexto del negocio:
- Supabase Free pausa la DB tras 7 dias sin actividad (feriados, vacaciones)
- Storage gratuito limitado a 1GB — fotos de celular sin comprimir lo llenan rapido
- Las imagenes del POS se servian sin optimizar (sin WebP, sin resize, sin cache CDN)
- Las variantes de producto se actualizaban con queries secuenciales (N round-trips)

### Cambios realizados:

**Infraestructura:**
- [x] Cron keep-alive: `app/api/keep-alive/route.ts` — query minima a Supabase diaria
- [x] `vercel.json` — configura cron a las 8 AM UTC (3 AM Peru)
- [x] Requiere variable de entorno `CRON_SECRET` en Vercel Dashboard

**Optimizacion de imagenes:**
- [x] Quitar `unoptimized` de `<Image>` en `components/pos/catalogo-productos.tsx` — Next.js ahora convierte a WebP, redimensiona y cachea en CDN
- [x] Instalar `sharp` como dependencia explicita para compresion server-side
- [x] Comprimir imagenes al subir en `actions/productos.ts`: conversion a WebP (quality 82), resize max 800px
- [x] Agregar `cacheControl: "31536000"` (1 año) en uploads a Storage — URLs con UUID son inmutables

**Rendimiento de queries:**
- [x] Batch update de variantes en `actions/productos.ts`: reemplazar loop `for...of` secuencial por `Promise.all` paralelo

### Archivos modificados:
- `actions/productos.ts` — compresion Sharp + cacheControl + batch update
- `components/pos/catalogo-productos.tsx` — quitar unoptimized
- `package.json` — agregar sharp como dependencia
- `app/api/keep-alive/route.ts` (nuevo)
- `vercel.json` (nuevo)

### Criterio de exito:
- Build pasa sin errores
- Imagenes del POS cargan como WebP via `/_next/image` (verificar en DevTools > Network)
- Imagenes nuevas se suben como `.webp` y pesan menos de 200KB
- Cron aparece en Vercel Dashboard > Cron Jobs tras deploy
- Editar producto con multiples variantes guarda correctamente

---

## Release 15: Gestion de Mesas por Sucursal

**Estado:** [x] Completado
**Dependencia:** Release 9 (Sucursales) + Release 5a (POS) + Release 5b/5c (Ordenes)
**Objetivo:** Permitir al admin configurar mesas con numero y sillas por sucursal, y al cajero/mesero seleccionar mesa desde una cuadricula visual en el POS al tomar pedidos "En local". Las mesas se ocupan automaticamente al crear la orden y se liberan al cobrar o cancelar.

### Contexto del negocio:
- El campo `mesa_referencia` era texto libre ("Mesa 3") — sin validacion ni control de estado
- Una pizzeria con local necesita saber que mesas estan ocupadas, libres o reservadas
- Cada sucursal tiene diferente cantidad de mesas
- Los comensales pueden pagar antes o despues de consumir — la mesa se libera al cobrar

### Decisiones de diseno:
- **Mesa se ocupa** al crear orden tipo "local" con mesa asignada
- **Mesa se libera** al cobrar (`cobrarOrdenAction`) o cancelar (`cancelarOrdenConMotivo`)
- **Multiples ordenes por mesa:** la mesa solo se libera cuando la ULTIMA orden activa es cobrada/cancelada
- **Reservaciones:** No en V1, el enum incluye `reservada` para futuro (solo admin puede marcar manualmente)
- **Backward compatible:** `mesa_referencia` se rellena automaticamente como "Mesa {numero}" al seleccionar
- **Gestion integrada en /sucursales** — no requiere nueva ruta ni cambios al middleware

### Nueva tabla DB: `mesas`

```
id          uuid PK DEFAULT gen_random_uuid()
sucursal_id uuid NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE
numero      integer NOT NULL
sillas      integer NOT NULL DEFAULT 4
estado      estado_mesa NOT NULL DEFAULT 'libre'  -- enum: libre|ocupada|reservada
activa      boolean NOT NULL DEFAULT TRUE
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
CONSTRAINT  mesas_numero_sucursal_unique UNIQUE (sucursal_id, numero)
```

### Cambios en tablas existentes:
- `ordenes` → agregar `mesa_id uuid REFERENCES mesas(id) ON DELETE SET NULL`

### Nuevo enum: `estado_mesa`
- `libre` | `ocupada` | `reservada`

### RLS:
- SELECT: todos los usuarios autenticados
- INSERT/UPDATE/DELETE: solo administrador

### Commits esperados:

**DB:**
- [x] Migracion: enum `estado_mesa`, tabla `mesas`, columna `mesa_id` en ordenes
- [x] Indice en `mesas(sucursal_id)`, constraint UNIQUE `(sucursal_id, numero)`
- [x] RLS: authenticated SELECT, admin ALL
- [x] Trigger `set_updated_at` en mesas
- [x] Tipos TypeScript actualizados (database.ts)

**Backend:**
- [x] Servicio `lib/services/mesas.ts`: getMesasPorSucursal, getTodasLasMesas, createMesa, updateMesa, deleteMesa, updateEstadoMesa, liberarMesaSiCorresponde
- [x] Validaciones Zod `lib/validations/mesas.ts`: mesaSchema (numero, sillas, activa)
- [x] Server Actions `actions/mesas.ts`: CRUD + cambiarEstadoMesaAction (verificacion rol admin)
- [x] Agregar `mesa_id` a `crearOrdenSchema` en `lib/validations/ordenes.ts`
- [x] Modificar `crearOrden` en `lib/services/ordenes.ts`: incluir mesa_id en insert + marcar mesa como ocupada
- [x] Modificar `cancelarOrdenConMotivo` en `lib/services/ordenes.ts`: liberar mesa si corresponde
- [x] Modificar `cobrarOrdenAction` en `app/(dashboard)/ordenes/actions.ts`: liberar mesa si corresponde
- [x] Modificar `crearOrdenAction` en `actions/ordenes.ts`: pasar mesa_id

**UI — Gestion de mesas (admin en /sucursales):**
- [x] Componente `components/mesas/mesa-form.tsx` (react-hook-form + zod: numero, sillas, activa)
- [x] Componente `components/mesas/mesa-admin-dialog.tsx` (cuadricula de mesas + crear/editar/eliminar)
- [x] Boton "Gestionar mesas" con contador en cada tarjeta de sucursal
- [x] Cargar mesas agrupadas por sucursal en `app/(dashboard)/sucursales/page.tsx`

**UI — Selector de mesas en POS:**
- [x] Componente `components/pos/selector-mesa.tsx` (cuadricula touch-friendly: verde=libre, rojo=ocupada, amarillo=reservada)
- [x] Reemplazar input de texto por SelectorMesa en `formulario-pedido-dialog.tsx` (fallback a input si no hay mesas)
- [x] Agregar prop `mesas` a PosClient y FormularioPedidoDialog
- [x] Cargar mesas en `app/(dashboard)/pos/page.tsx` via Promise.all
- [x] Limpiar mesa_id al cambiar tipo de pedido

### Archivos nuevos:
- `lib/services/mesas.ts`
- `lib/validations/mesas.ts`
- `actions/mesas.ts`
- `components/mesas/mesa-form.tsx`
- `components/mesas/mesa-admin-dialog.tsx`
- `components/pos/selector-mesa.tsx`

### Archivos modificados:
- `types/database.ts` — nuevos tipos para tabla mesas + enum estado_mesa + mesa_id en ordenes
- `lib/validations/ordenes.ts` — agregar mesa_id al schema
- `lib/services/ordenes.ts` — ocupar mesa al crear, liberar al cancelar
- `actions/ordenes.ts` — pasar mesa_id a crearOrden
- `app/(dashboard)/ordenes/actions.ts` — liberar mesa al cobrar
- `components/pos/formulario-pedido-dialog.tsx` — SelectorMesa con fallback
- `components/pos/pos-client.tsx` — prop mesas
- `app/(dashboard)/pos/page.tsx` — cargar mesas
- `components/sucursales/sucursales-cliente.tsx` — boton gestionar mesas + dialog
- `app/(dashboard)/sucursales/page.tsx` — cargar mesas por sucursal

### Criterio de exito:
- Admin puede crear/editar/eliminar mesas desde /sucursales → "Gestionar mesas"
- En POS, al elegir "En local" aparece cuadricula de mesas con colores por estado
- Al confirmar pedido con mesa, la mesa cambia a "ocupada"
- Al cobrar la orden, la mesa vuelve a "libre"
- Al cancelar la orden, la mesa vuelve a "libre"
- Si hay 2 ordenes en la misma mesa, solo se libera al cobrar/cancelar ambas
- Si no hay mesas configuradas, aparece input de texto como antes (backward compatible)
- Cambiar de sucursal en POS muestra las mesas de esa sucursal
- Build pasa sin errores

---

## Release 16: Reservas de Mesas (pendiente)

**Estado:** [ ] Pendiente
**Dependencia:** Release 15 (Gestion de Mesas)
**Objetivo:** Permitir al cajero/admin reservar mesas con fecha, hora, cliente y duracion estimada. Las mesas reservadas se muestran en amarillo en el POS y se liberan automaticamente al vencer la reserva o al asignarlas a una orden.

### Funcionalidades esperadas:
- Crear reserva: mesa, fecha, hora, duracion estimada, nombre del cliente, telefono, cantidad de personas, notas
- Ver reservas del dia en una vista de agenda o timeline por mesa
- Mesa en estado `reservada` visible en POS (amarillo) — no seleccionable a menos que el cajero confirme
- Liberacion automatica: si la reserva vence (hora + duracion) sin que llegue el cliente, la mesa vuelve a `libre`
- Notificacion o indicador visual cuando una reserva esta proxima (ej: 15 min antes)
- Historial de reservas por mesa y por cliente

### Consideraciones:
- El enum `estado_mesa` ya incluye `reservada` (creado en R15)
- La action `cambiarEstadoMesaAction` ya permite marcar una mesa como reservada manualmente
- Se necesita nueva tabla `reservas` con FK a `mesas` y opcionalmente a `clientes`
- Evaluar si se necesita un cron job para liberar reservas vencidas automaticamente

---

## Release 17: Promociones Mejoradas

**Estado:** [x] Completado
**Dependencia:** Release 7 (Promociones base) + Release 9 (Sucursales) + Release 5a (POS)
**Objetivo:** Evolucionar el sistema de promociones para cubrir escenarios reales de pizzeria: 2x1, combos a precio fijo, happy hours, delivery gratis, programacion por dia de la semana, filtro por sucursal, y mostrar precio antes/despues en el POS.

### Contexto del negocio:
- El sistema actual solo soporta descuento porcentaje y fijo — insuficiente para pizzerias reales
- Las promos no se filtran por sucursal ni por dia/hora
- `promocion_id` no se persiste en ordenes (bug)
- No se muestra precio antes/despues en el POS
- Se necesitan promos tipo: 2x1 en pizzas, combo familiar, pizza del dia, happy hour, delivery gratis

### Tipos de promocion soportados:

| Tipo | Ejemplo | Logica |
|------|---------|--------|
| `descuento_porcentaje` | 40% OFF pizza del dia | % sobre subtotal de productos elegibles |
| `descuento_fijo` | S/. 10 off en pedidos > S/. 50 | Resta monto fijo (con pedido minimo opcional) |
| `2x1` | 2x1 en pizzas medianas (martes) | Cada 2 items elegibles, el mas barato es gratis |
| `combo_precio_fijo` | 3 pizzas + 3 bebidas por S/. 89.90 | Precio fijo si carrito tiene todos los productos del combo |
| `delivery_gratis` | Delivery gratis en pedidos > S/. 50 | delivery_fee = 0 si subtotal >= pedido_minimo |

### Nuevo enum DB: `tipo_promocion`
```
'descuento_porcentaje' | 'descuento_fijo' | '2x1' | 'combo_precio_fijo' | 'delivery_gratis'
```

### Nuevas columnas en `promociones`:
- `tipo_promocion` — enum NOT NULL (reemplaza tipo_descuento)
- `dias_semana` — integer[] nullable (0=dom..6=sab, null=todos)
- `hora_inicio` / `hora_fin` — time nullable (happy hours)
- `pedido_minimo` — numeric nullable (delivery gratis, descuento fijo)
- `precio_combo` — numeric nullable (combo precio fijo)

### Nueva tabla: `promocion_sucursales`
```
promocion_id  uuid FK → promociones ON DELETE CASCADE
sucursal_id   uuid FK → sucursales ON DELETE CASCADE
PRIMARY KEY (promocion_id, sucursal_id)
```
Si vacia = aplica a todas las sucursales.

### Cambio en tabla `ordenes`:
- Agregar `promocion_id uuid REFERENCES promociones(id) ON DELETE SET NULL`

### Cambios esperados:

**DB:**
- [ ] Migracion: enum `tipo_promocion`, columnas nuevas en `promociones`, datos migrados
- [ ] Migracion: tabla `promocion_sucursales` con RLS
- [ ] Migracion: columna `promocion_id` en `ordenes`
- [ ] Tipos TypeScript actualizados (database.ts)

**Backend:**
- [ ] Constantes `TIPO_PROMOCION`, `TIPO_PROMOCION_LABELS`, `DIAS_SEMANA_LABELS` en `lib/constants.ts`
- [ ] Reescribir `lib/promociones-utils.ts`: logica de calculo por tipo, vigencia con dia/hora, aplicabilidad
- [ ] Reescribir `lib/validations/promociones.ts`: schema con tipo_promocion, campos condicionales, sucursales_ids
- [ ] Actualizar `lib/services/promociones.ts`: CRUD con sucursales, `getPromocionesActivas(sucursalId)` filtrado
- [ ] Fix: persistir `promocion_id` en `crearOrden()`, `crearOrdenAction()` y `cobrarOrdenAction()`
- [ ] Actualizar `actions/promociones.ts` con campos nuevos

**UI Admin (/promociones):**
- [ ] Formulario reorganizado en secciones: tipo, vigencia, dias, horario, sucursales, productos
- [ ] Campos condicionales segun tipo (valor_descuento, precio_combo, pedido_minimo)
- [ ] Selector de dias de la semana (7 toggle-pills)
- [ ] Switch "Restringir por horario" + inputs hora
- [ ] Multi-select de sucursales con badges
- [ ] Selector de productos con label contextual por tipo
- [ ] Cards de lista actualizadas con badges de tipo, dias, horario, sucursales
- [ ] Cargar sucursales en `promociones/page.tsx`

**UI POS:**
- [ ] `getPromocionesActivas(sucursalId)` filtrado por sucursal en `pos/page.tsx`
- [ ] Selector de promos mejorado: lista de cards con nombre, descripcion, descuento calculado
- [ ] Precio antes/despues visible en resumen de totales
- [ ] Promos no aplicables en gris
- [ ] Delivery gratis aplica al fee, no al subtotal

### Logica de calculo por tipo:

**2x1:** Items elegibles ordenados por precio DESC. Cada 2, el segundo es gratis.
```
Carrito: Pizza Hawaiana (S/.34.90) + Pizza Americana (S/.32.50)
Descuento: S/.32.50 (la mas barata)
```

**Combo precio fijo:** Si el carrito contiene todos los productos requeridos:
```
Carrito: 3 pizzas (S/.90) + 3 bebidas (S/.30) = S/.120
Precio combo: S/.89.90
Descuento: S/.120 - S/.89.90 = S/.30.10
```

**Delivery gratis:** Si subtotal >= pedido_minimo, el delivery_fee se anula.

### Archivos nuevos:
- Ninguno (se modifican archivos existentes)

### Archivos a modificar:
- `types/database.ts` — regenerar
- `lib/constants.ts` — agregar constantes de tipos de promocion
- `lib/promociones-utils.ts` — reescribir logica completa
- `lib/validations/promociones.ts` — reescribir schema
- `lib/services/promociones.ts` — CRUD con sucursales + filtro por sucursal/dia/hora
- `lib/services/ordenes.ts` — agregar promocion_id en crearOrden
- `actions/ordenes.ts` — pasar promocion_id
- `actions/promociones.ts` — campos nuevos
- `app/(dashboard)/ordenes/actions.ts` — pasar promocion_id en cobrarOrden
- `app/(dashboard)/pos/page.tsx` — pasar sucursalId a getPromocionesActivas
- `app/(dashboard)/promociones/page.tsx` — cargar sucursales
- `components/promociones/formulario-promocion-dialog.tsx` — UI extendida
- `components/promociones/lista-promociones.tsx` — cards con nuevos badges
- `components/pos/formulario-pedido-dialog.tsx` — selector mejorado + precio antes/despues

### Filtro por medida/tamaño (R17.1):

Las promociones pueden filtrarse por medida/tamaño específico (ej: solo "Personal", solo "Familiar").

**Nueva tabla:** `promocion_medidas`
```
promocion_id  uuid FK → promociones ON DELETE CASCADE
medida_id     uuid FK → categoria_medidas ON DELETE CASCADE
PRIMARY KEY (promocion_id, medida_id)
```
Si vacia = aplica a todos los tamaños.

**Ejemplo:** "50% off en Pizza Personal todos los viernes y sábado"
- tipo_promocion: descuento_porcentaje
- valor_descuento: 50
- dias_semana: [5, 6] (viernes y sábado)
- medidas_ids: [id de "Personal"]
- productos_ids: [ids de pizzas] (o vacío para todas)

**Logica de coincidencia (itemCoincideConPromo):**
- Si tiene productos_ids Y medidas_ids → item debe coincidir en ambos
- Si solo tiene medidas_ids → item debe tener esa medida (cualquier producto)
- Si solo tiene productos_ids → item debe ser ese producto (cualquier tamaño)
- Si no tiene ninguno → aplica a todo

**Cambios adicionales:**
- `medida_id` agregado al item del carrito (`hooks/use-carrito.ts`)
- Selector de medidas (toggle-pills) en formulario de promociones admin
- Carga de medidas en `app/(dashboard)/promociones/page.tsx`

### Criterio de exito:
- Crear promo "descuento_porcentaje" 40% → descuento visible en POS
- Crear promo "2x1" en pizzas → 2 pizzas en carrito → la mas barata se descuenta
- Crear promo "combo_precio_fijo" → carrito con todos los productos → precio combo aplicado
- Crear promo "delivery_gratis" con minimo S/. 50 → delivery fee = 0 si subtotal >= 50
- Promo restringida a 1 sucursal no aparece en otra
- Promo "solo martes" aparece/desaparece segun el dia
- Promo con happy hour solo aparece en el rango de horas
- Promo restringida a tamaño "Personal" solo aplica a items con esa medida
- `promocion_id` se guarda en ordenes y ventas al cobrar
- Precio antes/despues visible en POS cuando hay promo
- Build pasa sin errores

---

## Release 19: Promociones en POS — Venta y Visualizacion

**Estado:** [x] Completado
**Dependencia:** Release 17 (Promociones Mejoradas)
**Objetivo:** Transformar las promociones de un simple descuento al confirmar pedido a una experiencia de venta completa en el POS. El cajero ve las promos, las selecciona, configura los productos incluidos, y se agregan al carrito como un item agrupado.

### Decisiones de diseno:
- **Tab "Ofertas"** en catalogo POS — pestana separada para ver/ofrecer promos
- **Combo como item agrupado** en carrito — no productos sueltos. Quitar = quitar todo el combo
- **Flujo guiado** para combos — elegir variantes/sabores/extras de cada producto
- **Promos modificables o fijas** — opcion al crear: modificable (cajero elige) o fija (predefinida)
- **Descuento pre-filtra** catalogo — al activar promo de descuento, solo se ven productos elegibles
- **Tipos de pedido** — cada promo puede restringirse a Local, Delivery, Recojo o Todos

### Fases de implementacion:

**FASE A — Tipo de pedido + campo modificable (fundacion):**
- [x] Migracion DB: `tipos_pedido text[]` + `permite_modificaciones boolean` en `promociones`
- [x] Utils: `promoAplicaATipoPedido()` en `promociones-utils.ts`
- [x] Validaciones + Actions + Servicio: campos nuevos
- [x] Formulario admin: toggle-pills tipo pedido + switch modificable
- [x] POS: filtrar promos por tipo pedido, limpiar si cambia, auto-seleccionar si 1 tipo

**FASE B — Item de promo agrupado en carrito:**
- [x] Nuevo tipo `ItemPromoCarrito` en `use-carrito.ts`
- [x] Hook: `agregarPromo()`, `eliminarPromo()`, subtotal con promos
- [x] Carrito UI: card agrupada con productos, precio tachado, boton quitar combo
- [x] Sincronizar items promo con formulario de pedido

**FASE C — Tab "Ofertas" + Flujo de seleccion:**
- [x] Componente `catalogo-promos.tsx`: cards de promos con acciones por tipo
- [x] Componente `combo-builder-dialog.tsx`: flujo paso a paso para armar combos
- [x] Vista filtrada en catalogo cuando hay promo de descuento activa
- [x] Tab "Ofertas" en catalogo con contador

**FASE D — Visibilidad en ordenes y cobro:**
- [x] Orden confirmada: linea de descuento
- [x] Tarjeta de orden: badge/texto de descuento
- [x] Cobro dialog: linea "Descuento promocion"

**FASE E — Validaciones y pulido:**
- [x] Limpiar promo si carrito cambia y ya no aplica
- [x] Auto-sugerencia badge "Promos disponibles" si carrito cumple condiciones
- [x] Validar vigencia de promo al confirmar

### Ejemplo de promo en carrito:
```
PROMO: Combo Familiar           S/. 49.90
  * Pizza Familiar (Suprema)
    sin Aceitunas + Extra Queso
    + Mini: Americana
  * Inca Kola 1 Litro
  [Quitar combo]
-----
Cerveza Corona (Personal)       S/.  5.00
-----
Subtotal                        S/. 54.90
```

### Archivos nuevos:
- `components/pos/catalogo-promos.tsx`
- `components/pos/combo-builder-dialog.tsx`

### Archivos a modificar:
- `types/database.ts` — campos nuevos en promociones
- `lib/promociones-utils.ts` — tipo pedido + funciones promo
- `lib/validations/promociones.ts` — campos nuevos
- `lib/services/promociones.ts` — campos nuevos
- `actions/promociones.ts` — pasar campos nuevos
- `hooks/use-carrito.ts` — tipo ItemPromoCarrito + funciones
- `components/pos/carrito.tsx` — render item agrupado
- `components/pos/catalogo-productos.tsx` — tab Ofertas + vista filtrada
- `components/pos/pos-client.tsx` — pasar promos a subcomponentes
- `components/pos/formulario-pedido-dialog.tsx` — filtro tipo pedido + sync promo items
- `components/promociones/formulario-promocion-dialog.tsx` — campos nuevos admin
- `components/pos/orden-confirmada-dialog.tsx` — desglose descuento
- `components/ordenes/tarjeta-orden.tsx` — badge descuento
- `components/ordenes/cobro-dialog.tsx` — linea descuento promo

### Criterio de exito:
- Tab "Ofertas" en POS muestra promos activas con cards informativas
- Combo se agrega como 1 item agrupado al carrito
- Combo fijo se agrega directo; modificable pasa por flujo de seleccion
- Promo de descuento filtra catalogo a productos elegibles con precio tachado
- Promo restringida a tipo pedido no aparece en otro tipo
- Descuento visible en orden confirmada, tarjeta orden y cobro
- Quitar combo del carrito elimina todos sus productos
- Build pasa sin errores

---

## Release 20: Cuenta de Mesa y Cobro Agrupado

**Estado:** [x] Completado
**Dependencia:** Release 15 (Gestion de Mesas) + Release 5b/5c (Ordenes/Cobro)
**Objetivo:** Permitir ver todas las ordenes activas de una mesa agrupadas ("la cuenta") y cobrarlas en un solo pago. Cubre el escenario real de un grupo en una mesa que hace multiples pedidos y paga todo junto al final.

### Contexto del negocio:
- Un grupo en la Mesa 5 puede hacer varias ordenes: primero una pizza, luego otra ronda, una para llevar
- Quien ordena puede ser distinto de quien paga (Ana Maria ordena, Juan Martin paga)
- El cajero necesita ver "la cuenta de la Mesa 5" con el total acumulado
- Hoy cada orden se cobra por separado — ineficiente para mesas con multiples pedidos

### Arquitectura actual (ya correcta, no requiere cambio de schema):
- `ordenes.mesa_id` nullable — multiples ordenes pueden apuntar a la misma mesa
- `ordenes.cliente_id` nullable — independiente de la mesa
- `liberarMesaSiCorresponde()` ya cuenta todas las ordenes activas antes de liberar
- `cobrarOrdenAction()` cobra una sola orden — necesita version agrupada

### Fases esperadas:

**Fase 1 — Vista "Cuenta de la mesa":**
- [ ] Filtro por mesa en /ordenes: "Ver cuenta de Mesa X"
- [ ] Vista resumida con todas las ordenes de una mesa + total acumulado
- [ ] Acceso desde el selector de mesas o desde la tarjeta de orden

**Fase 2 — Cobro agrupado:**
- [ ] Accion "Cobrar mesa completa": cobra todas las ordenes listas de una mesa
- [ ] Genera 1 sola venta que agrupa los items de todas las ordenes
- [ ] Todas las ordenes pasan a "entregada" + mesa se libera

**Fase 3 — Mejoras futuras:**
- [ ] Campo "pagado_por" en ventas (opcional, para registrar quien paga)
- [ ] Dividir cuenta: cada comensal paga su parte de las ordenes

### Diagrama de relaciones:
```
MESA 5
├── Orden #1: Pizza Familiar (local) → sin cliente
├── Orden #2: Pizza Mediana + Gaseosa (local) → sin cliente
├── Orden #3: Pizza Familiar (para llevar) → cliente: Ana Maria
└── COBRO AGRUPADO: Juan Martin paga las 3 ordenes → 1 sola venta
```

### Principio: La ORDEN es el centro
- La mesa es solo una UBICACION (opcional)
- El cliente es solo una REFERENCIA (opcional)
- Quien ordena ≠ quien paga
- La mesa se libera cuando TODAS sus ordenes estan pagadas/canceladas

---

## Release 17.2: Descuento Automatico por Producto en Carrito

**Estado:** [x] Completado
**Dependencia:** Release 17 (Promociones Mejoradas) + Release 19 (Promos en POS)
**Objetivo:** Si un producto tiene una promo de descuento (%) activa, al agregarlo al carrito el precio se ajusta automaticamente. Sin necesidad de ir a "Ofertas" ni seleccionar la promo manualmente.

### Arquitectura: Hibrido calculado en memoria
- NO se escribe `precio_oferta` en la DB (fragil con promos por dia/hora)
- Al cargar el POS, se calcula el precio con oferta para cada variante usando las promos activas
- El producto se ve como si tuviera precio de oferta automaticamente

### Tipos que se aplican automaticamente:
- `descuento_porcentaje` → precio_oferta calculado automaticamente
- `descuento_fijo` → precio_oferta calculado automaticamente
- `2x1` → se sugiere pero NO se auto-aplica (requiere 2 items)
- `combo_precio_fijo` → desde tab "Ofertas" (requiere seleccion)
- `delivery_gratis` → se aplica al fee, no al producto

### Reglas de acumulacion:
- Las promos NO se acumulan entre si
- Combos calculan sobre precios ORIGINALES, no sobre precios ya descontados
- Si el cajero agrega un combo con un producto ya en carrito con descuento → toast de aviso
- Extras NUNCA se descuentan (solo el precio_base de la variante)

### Cambios esperados:
- [ ] Recrear `detectarPromoParaVariante()` y `productoTienePromo()` en utils
- [ ] Agregar campos descuento a `ItemCarrito` en use-carrito.ts
- [ ] Badge promo + precio tachado en catalogo, selector medida, configurador pizza
- [ ] Precio tachado por item en carrito y confirmar pedido
- [ ] Descuento auto al agregar producto con promo al carrito

---

## Release 21: Descuento Membresia Automatico al Crear Orden

**Estado:** [x] Completado
**Dependencia:** Release 8 (Membresias) + Release 17 (Promociones)
**Objetivo:** Mover el descuento de membresia del cobro al POS. Al buscar un cliente con DNI que tiene membresia activa, el descuento se aplica automaticamente al subtotal en el formulario de pedido.

### Problema actual:
- En el POS solo se muestra un aviso: "Este cliente tiene X% de descuento por membresia (aplicar al momento del cobro)"
- En el cobro, el cajero debe seleccionar manualmente el nivel de una lista global
- No hay preseleccion automatica aunque el cliente ya fue identificado

### Cambios esperados:
- [ ] Al seleccionar cliente con membresia activa → descuento auto en formulario de pedido
- [ ] Linea "Descuento membresia ({nivel}): -S/. X.XX" en resumen del POS
- [ ] Sumar al campo `descuento` de la orden
- [ ] Quitar seleccion manual de nivel en cobro dialog
- [ ] El cobro solo muestra el descuento que ya viene aplicado (display)

---

## Release 19.1: Combo con Configurador de Producto Integrado

**Estado:** [x] Completado
**Dependencia:** Release 19 (Promos en POS)
**Objetivo:** Cuando un combo incluye una pizza, el flujo guiado del combo-builder debe integrar el configurador de pizza (sabores, exclusiones, extras, acompanante).

### Cambios esperados:
- [ ] En combo-builder-dialog: detectar si el producto tiene `tiene_sabores === true`
- [ ] Si es pizza: abrir ConfiguradorProductoDialog como sub-paso
- [ ] Al confirmar pizza: guardar sabores/extras/acompanante en el item del combo
- [ ] Si NO es pizza: mantener selector de variante actual
- [ ] Pasar saboresPorCategoria y extrasPorCategoria al combo-builder

---

## Release 18: Promociones Exclusivas por Membresia y Nivel

**Estado:** [x] Completado
**Dependencia:** Release 17 (Promociones Mejoradas) + Release 8 (Membresias)
**Objetivo:** Agregar filtro de membresia/nivel a las promociones, permitiendo crear promos exclusivas para miembros (ej: 50% off para nivel Oro, delivery gratis permanente para VIP). Reutiliza toda la infraestructura de tipos de promo de R17.

### Funcionalidades esperadas:
- Agregar campo opcional `nivel_membresia_id` (FK nullable) a promociones
- Opcion "Solo para miembros" en formulario de promocion con selector de nivel(es)
- En POS: si el cliente tiene membresia, mostrar promos exclusivas de su nivel ademas de las publicas
- Promos de membresia pueden ser permanentes (sin fecha fin) o con vigencia limitada
- Promo tipo "Cumpleanos del miembro": descuento especial solo en el mes de cumpleanos del cliente
- Mostrar badge "Exclusivo miembros" o "Nivel Oro" en la card de la promo
- Si el cajero selecciona un cliente con membresia, las promos de su nivel se habilitan automaticamente

### Consideraciones:
- R17 ya tiene la infraestructura de tipos de promo (%, fijo, 2x1, combo, delivery gratis)
- R18 solo agrega el filtro de QUIEN puede usar la promo, no cambia COMO funciona
- La tabla `membresias_niveles` ya existe (R8) con: nombre, puntos_requeridos, descuento_porcentaje
- La tabla `clientes` tiene `fecha_nacimiento` para la promo de cumpleanos
- Se necesita nueva tabla `promocion_niveles` o columna `niveles_membresia_ids` en promociones

---

## Release 22: Sistema de Membresias Completo

**Estado:** [x] Completado
**Dependencia:** Release 8 (Membresias base)
**Objetivo:** Convertir el modulo de membresias de solo configuracion (niveles y reglas) a un sistema funcional completo: asignar membresias a clientes, gestionar pagos (mensual/trimestral/anual), acumular puntos al consumir con upgrade automatico de nivel, y ver historial de pagos.

### Cambios en DB:

**Nuevos campos en `membresias_niveles`:**
- `precio_mensual numeric(10,2)` — precio por mes
- `precio_trimestral numeric(10,2)` — precio por 3 meses
- `precio_anual numeric(10,2)` — precio por año

**Nuevos campos en `membresias`:**
- `tipo_plan text` — 'mensual', 'trimestral', 'anual'
- `monto_pagado numeric(10,2)` — cuanto pago
- `fecha_ultimo_pago timestamptz` — ultimo pago registrado

**Nueva tabla `membresia_pagos`:**
- id, membresia_id FK, monto, tipo_plan, fecha_pago, periodo_inicio, periodo_fin, created_at

**Nuevo campo en `reglas_puntos`:**
- `nivel_membresia_id uuid FK` — puntos por nivel (Bronce=1x, Plata=1.25x, Oro=1.5x)

### Fases:

**Fase 1 — DB + precios de nivel:**
- [ ] Migraciones DB (campos en niveles, campos en membresias, tabla pagos, campo en reglas)
- [ ] Formulario de nivel mejorado con campos de precio
- [ ] Regenerar types

**Fase 2 — Asignar membresia a cliente:**
- [ ] Servicio: asignarMembresia(), getMembresiasConCliente()
- [ ] Action: asignarMembresiaAction
- [ ] Tab "Miembros" en /membresias con lista de membresias por cliente
- [ ] Dialog "Asignar membresia" con buscador de cliente + selector nivel + plan
- [ ] Registro de pago al asignar

**Fase 3 — Acumular puntos al cobrar:**
- [ ] En cobrarOrdenAction: calcular puntos segun regla del nivel del cliente
- [ ] UPDATE membresias SET puntos_acumulados += puntos
- [ ] Si supera umbral del siguiente nivel → upgrade automatico

**Fase 4 — Historial de pagos y estado:**
- [ ] Vista de historial de pagos por membresia
- [ ] Indicador pago al dia / vencido
- [ ] Desactivar membresia si no pago (manual)

### Decisiones de diseno:
- Puntos diferentes por nivel (Bronce gana menos, Oro gana mas)
- Pago de membresia desde admin (no desde POS)
- Nivel 1 (Bronce) es el nivel inicial de todos los nuevos miembros
- El campo `orden` de niveles define la jerarquia (1=mas bajo, 4=mas alto)

### Archivos nuevos:
- `components/membresias/asignar-membresia-dialog.tsx`
- `components/membresias/lista-miembros.tsx`

### Archivos a modificar:
- `types/database.ts` — regenerar
- `lib/services/membresias.ts` — funciones de membresia de cliente
- `lib/validations/membresias.ts` — schemas para asignar + pago
- `actions/membresias.ts` — acciones de membresia de cliente
- `components/membresias/lista-membresias.tsx` — tab "Miembros"
- `components/membresias/formulario-nivel-dialog.tsx` — campos precio
- `app/(dashboard)/membresias/page.tsx` — cargar datos de miembros
- `app/(dashboard)/ordenes/actions.ts` — acumular puntos al cobrar

### Criterio de exito:
- Nivel Bronce configurado con precios mensual/trimestral/anual
- Membresia asignada a clientes DNI 43456170 y 43456179
- Lista de miembros visible en /membresias tab "Miembros"
- En POS: descuento de membresia se aplica auto al buscar cliente
- Al cobrar: puntos se acumulan en la membresia del cliente
- Build pasa sin errores

---

## Release 23: Sesiones de Caja (Cierre de Caja) + Pedidos Programados

**Estado:** [x] Completado
**Dependencia:** Release 5c (Cobro) + Release 9 (Sucursales) + Release 11 (Usuarios)
**Objetivo:** Implementar control de efectivo por turno (sesiones de caja) con horario flexible, una caja por sucursal, y soporte para pedidos programados (entregas fuera del horario operativo).

### Contexto del negocio:
- DANI PIZZAS opera con turnos de 5 PM a 11:30 PM, pero el cierre puede hacerse pasando medianoche y a veces hay ventas tras las 12 AM
- El negocio recibe pedidos programados (ej: 10 pizzas para entrega en la mañana a una institucion educativa) que se toman fuera del horario operativo
- Los pedidos programados pueden cobrarse al momento, al entregar, o por transferencia
- Hoy no existe control de efectivo por turno, no se detectan descuadres, y los reportes mezclan ventas de turnos consecutivos por fecha calendario

### Decisiones de diseno:
- **Una caja por sucursal** (no por cajero) — una sola sesion abierta a la vez por sucursal, todos los cajeros de esa sucursal registran ventas a la misma sesion
- **Quien abre puede ser distinto al que cierra** — campos `abierta_por` y `cerrada_por` separados
- **Sesion = duracion real, no fecha calendario** — una venta a las 12:30 AM cae en la sesion que se abrio a las 5 PM del dia anterior
- **Cobro independiente de la orden** — la `venta` se asocia con la sesion activa al momento del cobro, no al momento de crear la orden
- **Pedido programado** desacoplado — la orden se crea hoy, el cobro entra a la sesion activa cuando ocurra (hoy, manana o sin caja si es transferencia)
- **Roles:** administrador y cajero pueden abrir/cerrar caja. Mesero y repartidor sin acceso.
- **Visibilidad:** cajero ve solo su sucursal. Admin ve todas las sucursales con selector.

### Nueva tabla DB: `caja_sesiones`

```
id              uuid PK DEFAULT gen_random_uuid()
sucursal_id     uuid NOT NULL REFERENCES sucursales(id)
abierta_por     uuid NOT NULL REFERENCES profiles(id)
cerrada_por     uuid NULL REFERENCES profiles(id)
abierta_at      timestamptz NOT NULL DEFAULT now()
cerrada_at      timestamptz NULL
monto_inicial   numeric(10,2) NOT NULL DEFAULT 0
monto_contado_efectivo  numeric(10,2) NULL
diferencia      numeric(10,2) NULL
notas_apertura  text NULL
notas_cierre    text NULL
estado          text NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada'))
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

**Constraint critico:** indice unico parcial sobre `sucursal_id` filtrado a sesiones abiertas:
```sql
CREATE UNIQUE INDEX caja_sesiones_sucursal_abierta_idx
  ON caja_sesiones(sucursal_id) WHERE estado = 'abierta';
```
Garantiza maximo 1 sesion abierta por sucursal a nivel de DB.

### Cambios en tablas existentes:
- `ventas` → agregar `caja_sesion_id uuid REFERENCES caja_sesiones(id) ON DELETE SET NULL`
- `ordenes` → agregar `entrega_programada_at timestamptz NULL`

### RLS:
- `caja_sesiones`: SELECT autenticado (cajero ve solo de su sucursal, admin ve todas), INSERT/UPDATE solo administrador y cajero
- Trigger `set_updated_at` en `caja_sesiones`

### Fases esperadas:

**Fase 1 — DB:**
- [x] Migracion: tabla `caja_sesiones` + indice unico parcial + RLS
- [x] Migracion: campo `caja_sesion_id` en `ventas`
- [x] Migracion: campo `entrega_programada_at` en `ordenes`
- [x] Trigger `set_updated_at` en `caja_sesiones`
- [x] Regenerar tipos TypeScript

**Fase 2 — Backend:**
- [x] Servicio `lib/services/caja-sesiones.ts`: getSesionActivaPorSucursal, abrirSesion, cerrarSesion, getSesionesPorSucursal, getResumenSesion, getVentasSinSesion
- [x] Validaciones Zod `lib/validations/caja-sesiones.ts`
- [x] Server Actions `actions/caja-sesiones.ts`: abrirSesionAction, cerrarSesionAction
- [x] Modificar `cobrarOrdenAction` y `cobrarMesaAction`: asociar `caja_sesion_id` automaticamente con la sesion activa
- [x] Modificar `lib/services/ventas.ts`: incluir `caja_sesion_id` al insertar
- [x] Modificar `lib/validations/ordenes.ts`: agregar `entrega_programada_at` opcional
- [x] Modificar `lib/services/ordenes.ts`: soportar `entrega_programada_at` + getOrdenesProgramadasProximas

**Fase 3 — UI Cajero (Abrir/Cerrar caja):**
- [x] Nueva ruta `/caja` (cajero y administrador)
- [x] Componente `components/caja/abrir-caja-dialog.tsx`: input monto inicial + notas, InputNumerico + simbolo moneda
- [x] Componente `components/caja/cerrar-caja-dialog.tsx`: input monto contado + notas, preview de diferencia en tiempo real
- [x] Componente `components/caja/sesion-activa.tsx`: dashboard de sesion con totales por metodo de pago, monto esperado efectivo
- [x] Permisos: agregar `/caja` a `lib/roles.ts` (cajero y administrador)
- [x] Modificar `/pos`: indicador verde "Caja abierta" / ambar "Sin caja" en header del POS
- [x] Modificar `cobro-dialog.tsx`: banner ambar "No hay caja abierta" cuando no hay sesion activa (no bloquea)
- [x] Seccion "Ventas sin sesion" en `/reportes` (admin): total y desglose por metodo de pago

**Fase 4 — UI Admin (Historial y reportes):**
- [x] Nueva tab "Cierres de caja" en `/reportes` (ruta `/reportes/cierres`, visible para admin y cajero)
- [x] Lista de sesiones con filtros: rango de fechas (30 dias por defecto), sucursal ("Todas" para admin), con/sin diferencia
- [x] Vista detallada expandible por sesion: ventas por metodo, cuadre de efectivo (inicial/esperado/contado), notas de apertura y cierre
- [x] Tabs de navegacion `TabsReporte` en cabecera de ambas paginas de reportes

**Fase 5 — Pedidos programados (UI):**
- [x] Modificar `formulario-pedido-dialog.tsx`: toggle "Pedido programado" + input datetime-local con validacion futura
- [x] Modificar `tarjeta-orden.tsx`: badge purpura con CalendarClock y texto contextual ("Hoy 20:00", "Manana 08:00", fecha corta)
- [x] Modificar `/ordenes`: tab "Programados" con filtro y conteo dinamico
- [x] Modificar `/dashboard`: widget "Pedidos programados proximos" con las proximas 5 ordenes ordenadas por fecha

### Edge cases cubiertos:
- Cajero olvida abrir caja → ventas con `caja_sesion_id = null`, warning visible, futura mejora permite reasignar
- Cierre pasando medianoche → sesion se cierra a la hora real, ventas siguen asociadas a la misma sesion
- Venta a la 1 AM con caja abierta → entra a la sesion que abrio a las 5 PM
- Pedido programado pagado al entregar → cobro entra a la sesion activa de manana
- Pago por transferencia sin caja → venta con `caja_sesion_id = null`, no afecta cuadre de efectivo
- Multiples cajeros en la misma sucursal → comparten la misma sesion, cada venta guarda su `cajero_id`

### Archivos nuevos:
- `lib/services/caja-sesiones.ts`
- `lib/validations/caja-sesiones.ts`
- `actions/caja-sesiones.ts`
- `app/(dashboard)/caja/page.tsx`
- `components/caja/abrir-caja-dialog.tsx`
- `components/caja/cerrar-caja-dialog.tsx`
- `components/caja/sesion-activa.tsx`

### Archivos a modificar:
- `types/database.ts` — regenerar
- `lib/services/ventas.ts` — agregar `caja_sesion_id` al insertar
- `lib/services/ordenes.ts` — soportar `entrega_programada_at`
- `lib/validations/ordenes.ts` — agregar `entrega_programada_at`
- `app/(dashboard)/ordenes/actions.ts` — `cobrarOrdenAction` y `cobrarMesaAction` buscan sesion activa
- `lib/permissions.ts` y `lib/roles.ts` — agregar ruta `/caja`
- `components/pos/pos-client.tsx` — indicador caja abierta/cerrada
- `components/pos/formulario-pedido-dialog.tsx` — toggle pedido programado
- `components/pos/cobro-dialog.tsx` — warning sin sesion
- `components/ordenes/tarjeta-orden.tsx` — badge programado
- `app/(dashboard)/dashboard/*` — widget pedidos programados
- `app/(dashboard)/reportes/*` — tab "Cierres de caja"
- `components/layout/sidebar.tsx` — entrada "Caja"

### Criterio de exito:
- Cajero entra a `/caja`, abre con S/.50 inicial → estado "abierta"
- 3 ordenes cobradas (efectivo S/.46, tarjeta S/.30, efectivo S/.20) → todas con `caja_sesion_id`
- Pedido programado a las 10 PM con entrega manana 8 AM → orden visible con badge en `/ordenes`
- A las 12:15 AM cajero cierra con monto contado S/.116 → diferencia 0, estado "cerrada"
- Cobro del pedido programado al dia siguiente → entra a la sesion nueva
- Admin ve ambas sesiones (Casma + Villa Hermosa) en `/reportes` tab "Cierres de caja"
- Constraint impide abrir 2 sesiones simultaneas en la misma sucursal
- Build pasa sin errores

---

## Release 24: Redondeo de Vuelto al Décimo

**Estado:** [ ] Pendiente
**Dependencia:** Release 5c (Cobro)
**Objetivo:** Redondear el vuelto al múltiplo de S/. 0.10 más cercano (hacia abajo) para evitar dar céntimos que ya no circulan en Perú.

### Contexto del negocio:
- El vuelto de S/. 9.41 es impráctico porque el céntimo no circula
- El estándar en negocios peruanos es redondear a décimas (S/. 9.40)
- El redondeo debe afectar el **total registrado de la venta**, no solo el display, para que cuadre la caja
- Ejemplo: total S/. 80.59, recibe S/. 90 → vuelto redondeado S/. 9.40 → total registrado S/. 80.60 (diferencia de S/. 0.01 absorbida por el negocio)

### Decisiones de diseño pendientes:
- ¿Se redondea siempre o solo cuando el cajero lo activa?
- ¿Se registra el ajuste como campo separado en `ventas` (ej: `ajuste_redondeo`)? → necesario para auditoría
- ¿Aplica solo a efectivo o a todos los métodos? → lógicamente solo efectivo

### Impacto estimado:
- `lib/services/ventas.ts` → ajustar cálculo de total al insertar venta con efectivo
- `components/ordenes/cobro-dialog.tsx` → mostrar vuelto redondeado + nota de ajuste
- `components/ordenes/lista-ordenes.tsx` (cobrar mesa) → igual
- Posible campo `ajuste_redondeo numeric(4,2)` en tabla `ventas`

---

## Release 25: Gestión de Mesas Bloqueadas

**Estado:** [ ] Pendiente
**Dependencia:** Release 5b (Mesas) + Release 23 (Sesiones de caja)
**Objetivo:** Evitar que mesas queden bloqueadas indefinidamente por órdenes antiguas sin cobrar (ej: órdenes de prueba, cortes de luz, olvidos), y dar herramientas para liberarlas de forma controlada.

### Contexto del negocio:
- Una mesa queda en estado `ocupada` cuando se crea una orden en local
- Se libera automáticamente cuando la última orden activa de esa mesa es cobrada o cancelada
- Si una orden queda atascada (nunca cobrada, nunca cancelada), la mesa permanece bloqueada indefinidamente
- Casos reales: órdenes de prueba en fase de desarrollo, corte de sesión del cajero, error del sistema

### Soluciones propuestas (dos mecanismos complementarios):

**Mecanismo 1 — Liberación manual por admin/cajero:**
- Botón "Liberar mesa" en la vista de mesas o en la cuenta de mesa
- Cancela en lote todas las órdenes activas de esa mesa (con motivo "Liberación administrativa")
- Solo visible para `administrador` y `cajero`
- Muestra confirmación con lista de órdenes que se cancelarán

**Mecanismo 2 — Liberación automática al cierre de caja:**
- Al cerrar la sesión de caja, verificar si quedan mesas ocupadas con órdenes de esa sesión
- Si todas las órdenes de una mesa son anteriores a la sesión que se cierra → liberar mesa automáticamente (cancelar órdenes atascadas)
- Mostrar al cajero un resumen: "Se liberaron X mesas con órdenes sin cobrar"

**Mecanismo 3 (opcional a futuro) — Auto-liberación por inactividad:**
- Órdenes en estado cobrable por más de N horas (configurable, ej: 24h) → auto-cancelar y liberar mesa
- Requiere job programado o trigger en DB

### Solución inmediata (sin esperar el release):
Cancelar manualmente las órdenes atascadas desde `/ordenes` usando el botón "Cancelar" → esto dispara `liberarMesaSiCorresponde` automáticamente.

### Archivos a crear/modificar:
- `lib/services/mesas.ts` → función `liberarMesaForzado(mesaId, motivo)` que cancela órdenes activas en lote
- `actions/mesas.ts` → `liberarMesaForzadoAction` con permisos cajero/admin
- `components/mesas/boton-liberar-mesa.tsx` → dialog de confirmación
- `app/(dashboard)/caja/caja-client.tsx` → al cerrar caja, ejecutar limpieza de mesas con órdenes colgadas
- `lib/services/caja-sesiones.ts` → `cerrarSesion()` puede invocar limpieza opcional

---

## Release 26: Resiliencia ante Base de Datos Vacía (Clean Install)

**Estado:** [x] Completado
**Dependencia:** Ninguna (transversal)
**Objetivo:** Que la aplicación arranque sin errores cuando la base de datos está vacía (entrega a cliente nuevo, entorno de prueba limpio). Actualmente varias queries usan `.single()` que lanza excepción si la tabla devuelve 0 filas, bloqueando el POS y otras secciones.

### Contexto del problema:
- Al entregar el proyecto con BD limpia (sin datos de configuración), el POS y el dashboard lanzan "Cannot coerce the result to a single JSON object"
- La causa raíz es el uso de `.single()` en queries que esperan exactamente 1 fila pero no tienen garantía de ello en una BD vacía
- Las tablas afectadas son de configuración global, no de negocio (no son productos ni ventas)

### Tablas que deben tener datos mínimos para que la app funcione:

| Tabla | Por qué es crítica |
|---|---|
| `configuracion_negocio` | Cargada en layout/dashboard con `.single()` |
| `monedas` | Usada en POS y formateo de precios |
| `delivery_fees_config` | Cargada al seleccionar tipo de pedido delivery |
| `delivery_servicios` | Lista de servicios de delivery en el POS |
| `sucursales` | Requerida en casi todas las queries |
| `roles` | Requerida para el sistema de auth |

### Solución: reemplazar `.single()` por `.maybeSingle()` + manejo de null

**Regla:** Ninguna query hacia tablas de configuración debe usar `.single()`. Usar `.maybeSingle()` y manejar el caso `null` con un estado vacío, un valor por defecto, o una pantalla de configuración inicial.

**Patrón a aplicar:**

```typescript
// ❌ Antes — explota si la tabla está vacía
const { data } = await supabase
  .from('configuracion_negocio')
  .select('*')
  .single()

// ✅ Después — maneja el caso vacío
const { data } = await supabase
  .from('configuracion_negocio')
  .select('*')
  .maybeSingle()

if (!data) {
  // mostrar estado vacío o redirigir a pantalla de configuración inicial
}
```

### Archivos a auditar y corregir:

**Servicios (`lib/services/`):**
- [ ] `lib/services/configuracion.ts` — queries a `configuracion_negocio` y `delivery_fees_config`
- [ ] `lib/services/monedas.ts` — query a moneda activa
- [ ] `lib/services/delivery-servicios.ts` — query de servicios activos
- [ ] Cualquier otro servicio con `.single()` hacia tablas de configuración global

**Pages (`app/(dashboard)/`):**
- [ ] `app/(dashboard)/pos/page.tsx` — carga de configuración, moneda, fees, mesas
- [ ] `app/(dashboard)/dashboard/page.tsx` — carga de configuración del negocio
- [ ] `app/(dashboard)/configuracion/page.tsx` — carga de config, moneda, fees, servicios

**Componentes:**
- [ ] Cualquier componente que muestre datos de configuración y no tenga guard para `null`

### Comportamiento esperado con BD vacía:

- POS carga sin error — muestra mensaje "Configura tu negocio antes de operar" si faltan datos críticos
- Dashboard carga sin error — widgets muestran S/. 0.00 o estado vacío
- `/configuracion` carga sin error — permite crear la configuración inicial desde cero
- No se requiere insertar filas manualmente antes de usar la app

### Criterio de éxito:
- Clonar el proyecto, apuntar a una BD vacía (solo con schema), y poder navegar todas las rutas sin que lance un error 500
- El POS muestra un estado vacío o advertencia si no hay productos/sucursales configurados
- Build pasa sin errores

---

## Release 27: Seguridad — Auth y Rol en Server Actions de Estado de Orden

**Estado:** [x] Completado
**Dependencia:** Release 5b (Gestión de Órdenes)
**Prioridad:** 🔴 BLOQUEANTE — corrección de seguridad
**Objetivo:** Agregar verificación de autenticación y rol a los tres Server Actions que gestionan el estado de las órdenes. Actualmente cualquier llamada HTTP puede ejecutarlos sin control de acceso.

### Contexto del problema:
- `cambiarEstadoOrdenAction`, `cancelarOrdenAction` y `cambiarEstadoDeliveryAction` en `app/(dashboard)/ordenes/actions.ts` no verifican quién llama ni qué rol tiene.
- A diferencia de `cobrarOrdenAction` y `cobrarMesaAction` (que sí verifican auth + rol), estos tres actions ejecutan directamente contra la DB sin ningún control.
- Un usuario no autenticado o con rol incorrecto (ej: repartidor) podría cancelar órdenes o cambiar su estado.

### Archivos a modificar:
- `app/(dashboard)/ordenes/actions.ts` — los 3 actions afectados

### Cambios esperados:

**1. Agregar verificación auth + rol a los 3 actions:**
```ts
// Patrón a aplicar en cambiarEstadoOrdenAction, cancelarOrdenAction, cambiarEstadoDeliveryAction
export async function cambiarEstadoOrdenAction(
  ordenId: string,
  estado: EstadoOrden,
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const [{ data: rolNombre }, { data: { user } }] = await Promise.all([
    supabase.rpc("get_user_role"),
    supabase.auth.getUser(),
  ]);

  if (!user) return { data: null, error: "No autenticado" };
  if (!["administrador", "cajero", "mesero"].includes(rolNombre ?? "")) {
    return { data: null, error: "Sin permisos para cambiar estado de orden" };
  }

  try {
    await actualizarEstadoOrden(ordenId, estado);
    revalidatePath("/ordenes");
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
```

**2. Estandarizar tipo de retorno a `ActionResult<void>`:**
- Los 3 actions actualmente retornan `{ error?: string }` — inconsistente con el resto del codebase que usa `ActionResult<T>`.
- Cambiar a `ActionResult<void>` y actualizar los componentes que los consumen.

**3. Roles permitidos por action:**
| Action | Roles permitidos |
|--------|-----------------|
| `cambiarEstadoOrdenAction` | administrador, cajero, mesero |
| `cancelarOrdenAction` | administrador, cajero |
| `cambiarEstadoDeliveryAction` | administrador, cajero, repartidor |

### Commits esperados:
- [x] Agregar auth + rol a `cambiarEstadoOrdenAction`
- [x] Agregar auth + rol a `cancelarOrdenAction`
- [x] Agregar auth + rol a `cambiarEstadoDeliveryAction`
- [x] Cambiar tipo de retorno de `{ error?: string }` a `ActionResult<void>` en los 3 actions
- [x] Actualizar componentes consumidores si el cambio de tipo rompe algo

### Criterio de éxito:
- Un usuario no autenticado que llame directamente a los actions recibe "No autenticado"
- Un repartidor no puede cancelar órdenes
- Build pasa sin errores
- Los componentes que usan los 3 actions siguen funcionando correctamente

---

## Release 28: Correcciones de Calidad en Capa de Servicios

**Estado:** [x] Completado
**Dependencia:** Release 5b, Release 17, Release 23
**Prioridad:** 🟠 Importante
**Objetivo:** Corregir varios problemas puntuales en `lib/services/` detectados en auditoría: guards tardíos de `.single()`, deletes secuenciales sin paralelizar, `any` en componente de formulario, y fetch secuencial en página de perfil.

### Hallazgos a corregir:

**1. `caja-sesiones.ts` — `.single()` sin verificación inmediata**
- Línea ~100: se llama `.single()` y luego se usa `sesion?.monto_inicial` como guardia tardía. Si hay error de DB, `sesion` queda `undefined` y no se lanza excepción clara.
- Fix: verificar `if (error)` justo después del `.single()`, consistente con el resto del codebase.

**2. `ordenes.ts` — `.single()` sin verificación inmediata**
- Línea ~173: `.select("mesa_id").single()` seguido de uso en línea ~203 sin verificar error.
- Fix: mismo patrón — verificar error inmediatamente después del query.

**3. `promociones.ts` — 5 DELETEs secuenciales en `updatePromocion`**
- Líneas ~407–411: 5 operaciones de delete ejecutadas una tras otra.
- Fix: `await Promise.all([delete1, delete2, delete3, delete4, delete5])`.
- Impacto: reduce tiempo de actualización de promoción de ~5 round-trips a 1.

**4. `usuario-form.tsx` — `any` en props de `control`**
- Línea ~55: `function RepartidorDetallesFields({ control }: { control: any })` con supresión explícita de ESLint.
- Fix: usar el tipo genérico de react-hook-form:
```ts
import type { Control } from "react-hook-form";
import type { UsuarioFormValues } from "@/lib/validations/usuarios";

function RepartidorDetallesFields({ control }: { control: Control<UsuarioFormValues> })
```

**5. `perfil/page.tsx` — fetches secuenciales sin `Promise.all`**
- `auth.getUser()` y la query a `profiles` se ejecutan en secuencia.
- Fix: `Promise.all([supabase.auth.getUser(), supabase.from("profiles")...])`.

### Archivos a modificar:
- `lib/services/caja-sesiones.ts`
- `lib/services/ordenes.ts`
- `lib/services/promociones.ts`
- `components/usuarios/usuario-form.tsx`
- `app/(dashboard)/perfil/page.tsx`

### Commits esperados:
- [x] Fix guard inmediato en `caja-sesiones.ts` línea ~100
- [x] Fix guard inmediato en `ordenes.ts` línea ~173
- [x] Paralelizar 5 DELETEs en `promociones.ts` `updatePromocion()` y `deletePromocion()`
- [x] Reemplazar `any` por `Control<FormWithRepartidor>` en `usuario-form.tsx`
- [x] Paralelizar fetches en `perfil/page.tsx`

### Criterio de éxito:
- Build pasa sin errores
- TypeScript no reporta `any` en ningún archivo de componentes
- `npm run build` con `strict: true` sin advertencias nuevas

---

## Release 29: Arquitectura — Separación de Capas y Utilidad de Fechas

**Estado:** [x] Completado
**Dependencia:** Ninguna (transversal)
**Prioridad:** 🟠 Importante
**Objetivo:** Corregir dos violaciones a la arquitectura de capas detectadas en auditoría: (1) páginas que llaman directamente a Supabase sin pasar por `lib/services/`, y (2) funciones de cálculo de fecha con timezone Lima duplicadas en múltiples páginas.

### Hallazgo 1: Queries directas a Supabase en pages

Las siguientes páginas llaman a `supabase.from(...)` directamente para datos de negocio, saltando la capa de servicios:

| Archivo | Tabla consultada | Línea aprox. |
|---------|-----------------|--------------|
| `app/(dashboard)/caja/page.tsx` | `sucursales` | ~34 |
| `app/(dashboard)/dashboard/page.tsx` | `sucursales`, `profiles` | ~63–76 |
| `app/(dashboard)/pos/page.tsx` | `sucursales` | ~39 |
| `app/(dashboard)/reportes/page.tsx` | `sucursales` | ~73 |
| `app/(dashboard)/reportes/cierres/page.tsx` | `sucursales` | ~51 |
| `app/(dashboard)/promociones/page.tsx` | Múltiples tablas en funciones auxiliares internas | ~9–88 |

**Fix:** Verificar si `lib/services/sucursales.ts` ya tiene una función `getSucursales()` o `getSucursalesActivas()` y usarla. Si no cubre el caso de uso, extenderla antes de reemplazar las queries directas.

### Hallazgo 2: Funciones de fecha duplicadas

Las siguientes funciones están definidas localmente en múltiples páginas:

| Función | Páginas donde se duplica |
|---------|--------------------------|
| `getHoyLima()` | `ordenes/page.tsx`, `reportes/page.tsx`, `entregas/page.tsx` |
| `getMinFechaLima()` | `ordenes/page.tsx` |
| `hace7DiasLima()` | `reportes/page.tsx` |
| `hace30DiasLima()` | `reportes/cierres/page.tsx` |

**Fix:** Crear `lib/utils/fecha.ts` con todas estas funciones exportadas y reemplazar las definiciones locales por imports.

```ts
// lib/utils/fecha.ts
/** Retorna la fecha actual en Lima (UTC-5) como string YYYY-MM-DD */
export function getHoyLima(): string {
  const now = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return now.toISOString().split("T")[0];
}

export function getDiasAtrasLima(dias: number): string {
  const d = new Date(Date.now() - 5 * 60 * 60 * 1000);
  d.setDate(d.getDate() - dias);
  return d.toISOString().split("T")[0];
}
// getMinFechaLima, hace7DiasLima, hace30DiasLima → usar getDiasAtrasLima(7), etc.
```

### Archivos a crear:
- `lib/utils/fecha.ts` (nuevo)

### Archivos a modificar:
- `app/(dashboard)/ordenes/page.tsx`
- `app/(dashboard)/reportes/page.tsx`
- `app/(dashboard)/reportes/cierres/page.tsx`
- `app/(dashboard)/entregas/page.tsx`
- `app/(dashboard)/caja/page.tsx`
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/pos/page.tsx`
- `app/(dashboard)/promociones/page.tsx`

### Commits esperados:
- [x] Crear `lib/utils/fecha.ts` con funciones de timezone Lima
- [x] Reemplazar definiciones duplicadas en las 4 páginas que tienen `getHoyLima()` y similares
- [x] Mover queries directas de `sucursales` a llamadas vía `lib/services/sucursales.ts`
- [x] Extraer funciones auxiliares de `promociones/page.tsx` que usan Supabase directamente hacia `lib/services/`

### Criterio de éxito:
- No existe ninguna definición local de `getHoyLima()` en páginas
- No hay `supabase.from(...)` directo en archivos `page.tsx` para consultas de datos de negocio (solo se permiten `.rpc()` de auth)
- Build pasa sin errores

---

## Release 30: Refactorización de Componentes — useEffect y Lógica Compleja

**Estado:** [ ] Pendiente
**Dependencia:** Release 5b, Release 11, Release 15
**Prioridad:** 🟠 Importante / 🟡 Sugerencia
**Objetivo:** Eliminar el único `useEffect` para fetch de datos en componentes y extraer lógica de negocio compleja del POS a custom hooks o utilidades, mejorando la mantenibilidad y consistencia con el patrón del proyecto.

### Hallazgo 1: `useEffect` para fetch en `usuarios-tabla.tsx`

**Archivo:** `components/usuarios/usuarios-tabla.tsx` líneas ~74–86

```ts
// ❌ Anti-patrón — fetch de datos en Client Component con useEffect
useEffect(() => {
  const supabase = createClient();
  supabase.from("repartidor_detalles").select(...).eq("id", editando.id)
    .maybeSingle().then(({ data }) => setRepartidorDetalles(data ?? null));
}, [editando]);
```

**Fix:** Al abrir el dialog de edición de un usuario repartidor, cargar los detalles mediante una Server Action en lugar de llamar a Supabase desde el cliente.

```ts
// ✅ Alternativa — Server Action para cargar detalles al abrir dialog
async function handleEditarUsuario(usuario: Usuario) {
  if (usuario.rol_nombre === "repartidor") {
    const result = await getRepartidorDetallesAction(usuario.id);
    setRepartidorDetalles(result.data);
  }
  setEditando(usuario);
}
```

### Hallazgo 2: Lógica compleja en `configurador-producto-dialog.tsx`

**Archivo:** `components/pos/configurador-producto-dialog.tsx` líneas ~59–132

Contiene funciones de cálculo de proporciones, detección de límites por categoría de sabores, validaciones de combinaciones. Esta lógica no es de UI y es difícil de testear embebida en el componente.

**Fix:** Extraer a un custom hook `hooks/use-configurador-producto.ts` que reciba el producto, sabores disponibles y extras, y exponga los cálculos ya hechos al componente.

### Hallazgo 3: Funciones de parseo JSON en `tarjeta-orden.tsx`

**Archivo:** `components/ordenes/tarjeta-orden.tsx` líneas ~58–99

Funciones `parseSabores()`, `parseExtras()`, `parseAcompanante()` y `formatEntregaProgramada()` embebidas en el componente.

**Fix:** Mover a `lib/utils/orden-formatters.ts` — son utilidades puras y testables.

### Archivos a crear:
- `lib/utils/orden-formatters.ts` (nuevo)
- `hooks/use-configurador-producto.ts` (nuevo, opcional según complejidad)

### Archivos a modificar:
- `components/usuarios/usuarios-tabla.tsx`
- `components/ordenes/tarjeta-orden.tsx`
- `components/pos/configurador-producto-dialog.tsx` (refactorización progresiva)

### Commits esperados:
- [ ] Reemplazar `useEffect` de fetch en `usuarios-tabla.tsx` por Server Action
- [ ] Crear `lib/utils/orden-formatters.ts` con `parseSabores`, `parseExtras`, `parseAcompanante`, `formatEntregaProgramada`
- [ ] Actualizar `tarjeta-orden.tsx` para importar desde `orden-formatters.ts`
- [ ] (Opcional) Extraer lógica de cálculo de `configurador-producto-dialog.tsx` a hook

### Criterio de éxito:
- No hay llamadas directas a `createClient()` del cliente en componentes de tabla o listados (excepto casos justificados con realtime)
- `tarjeta-orden.tsx` no tiene funciones de parseo embebidas
- Build pasa sin errores

---

## Release 31: Estandarización de Tipos y Centralización de Dominio

**Estado:** [ ] Pendiente
**Dependencia:** Ninguna (transversal, bajo riesgo)
**Prioridad:** 🟡 Sugerencia
**Objetivo:** Centralizar los tipos de dominio dispersos en `lib/services/` hacia `types/`, estandarizar el uso de `ActionResult<T>` en todos los Server Actions, y reducir castings dobles `as unknown as T`.

### Hallazgo 1: Tipos de dominio dispersos

`EstadoOrden`, `OrdenConItems`, `NivelMembresia`, `UsuarioCompleto`, `PizzaSaborConIngredientes`, etc. están definidos en sus respectivos archivos de servicio. Cuando un componente necesita el tipo de `EstadoOrden`, debe importar desde `lib/services/ordenes` en lugar de desde `types/`.

**Fix:** Crear `types/domain.ts` y reexportar desde ahí los tipos de dominio principales. Los servicios siguen siendo la fuente de verdad pero reexportan desde `types/domain.ts`.

### Hallazgo 2: ActionResult inconsistente

`cambiarEstadoOrdenAction`, `cancelarOrdenAction` y `cambiarEstadoDeliveryAction` retornan `{ error?: string }` (este punto se resuelve en R27 como parte de la corrección de seguridad). Este release documenta la verificación final de que todos los actions usen `ActionResult<T>`.

### Hallazgo 3: Castings dobles `as unknown as T`

Presentes en `reportes.ts`, `ordenes.ts`, `clientes.ts`, `ventas.ts`. Indican divergencia entre los tipos generados por Supabase y los tipos de dominio locales. Considerar regenerar `types/database.ts` desde Supabase CLI o crear mappers explícitos.

### Archivos a crear:
- `types/domain.ts` (nuevo) — reexportaciones de tipos de dominio

### Archivos a modificar:
- `types/index.ts` — agregar export de `domain.ts`
- Servicios que definen tipos de dominio: reexportar desde `types/domain.ts`
- Server Actions que no usen `ActionResult<T>`: estandarizar (verificar post-R27)

### Commits esperados:
- [ ] Crear `types/domain.ts` con tipos de dominio principales
- [ ] Actualizar imports en componentes y pages que usen tipos desde servicios
- [ ] Verificar que todos los Server Actions usen `ActionResult<T>` (audit post-R27)
- [ ] Reducir castings `as unknown as T` creando mappers donde sea posible

### Criterio de éxito:
- Un componente puede importar `EstadoOrden` desde `@/types` en lugar de `@/lib/services/ordenes`
- No hay Server Actions con tipo de retorno `{ error?: string }` suelto
- Build pasa sin errores

---

## Release 32: UI Crítico — Touch Targets del Carrito y Tablas sin Scroll

**Estado:** [x] Completado
**Dependencia:** Release 5a (POS), Release 4 (Productos), Release 11 (Usuarios)
**Prioridad:** 🔴 CRÍTICO — afecta operación diaria en dispositivo táctil
**Objetivo:** Corregir los dos problemas críticos de usabilidad detectados en auditoría: los botones del carrito son demasiado pequeños para operar con los dedos (28px vs mínimo 44px), y las tablas de productos/usuarios no tienen scroll horizontal en móvil.

### Contexto del problema:
- El POS se opera en tablet táctil. Los botones +/- y eliminar del carrito son `h-7 w-7` (28px) y `p-1` (~14px), causando errores de toque frecuentes
- WCAG 2.5.5 e iOS HIG exigen mínimo 44×44px para elementos interactivos táctiles
- Las tablas de Productos y Usuarios no tienen `overflow-x-auto`, lo que hace que el contenido quede cortado o rompa el layout en pantallas < 768px

### Hallazgo 1: Botones del carrito — `components/pos/carrito.tsx`

```tsx
// ❌ Actual — líneas 96-128
// Botones +/-: h-7 w-7 = 28px
<Button size="icon" variant="outline" className="h-7 w-7">
// Botón eliminar: p-1 = ~14px
<button className="p-1"><Trash2 className="h-3.5 w-3.5" /></button>

// ✅ Corregir a mínimo táctil
<Button size="icon" variant="outline" className="h-10 w-10">
  <Minus className="h-4 w-4" />
</Button>
<Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive shrink-0">
  <Trash2 className="h-4 w-4" />
</Button>
```

### Hallazgo 2: Tablas sin scroll horizontal

```tsx
// ❌ productos-table.tsx ~línea 144 y usuarios-tabla.tsx ~línea 116
<div className="rounded-xl border overflow-hidden">
  <Table>...

// ✅ Agregar wrapper con scroll
<div className="rounded-xl border overflow-x-auto">
  <Table className="min-w-[640px]">...
```

### Archivos a modificar:
- `components/pos/carrito.tsx` — botones +/- y eliminar
- `components/productos/productos-table.tsx` — wrapper con overflow-x-auto
- `components/usuarios/usuarios-tabla.tsx` — wrapper con overflow-x-auto

### Commits esperados:
- [x] Aumentar botones +/- del carrito a `h-10 w-10` (de `h-7 w-7`)
- [x] Aumentar botón eliminar item del carrito a `h-10 w-10` (de `p-1`)
- [x] Agregar `overflow-x-auto` + `min-w-[640px]` en tabla de productos
- [x] Agregar `overflow-x-auto` + `min-w-[640px]` en tabla de usuarios

### Criterio de éxito:
- En tablet (768px), los botones del carrito se pueden tocar sin error en el primer intento
- En móvil (375px), las tablas de productos y usuarios tienen scroll horizontal y no rompen el layout
- Los botones miden mínimo 40×40px (idealmente 44×44px)
- Build pasa sin errores

---

## Release 33: UI Importante — Estandarización Touch-Friendly de Controles

**Estado:** [x] Completado
**Dependencia:** Release 32 (touch targets críticos)
**Prioridad:** 🟠 Importante
**Objetivo:** Estandarizar todos los controles interactivos a los tamaños táctiles correctos: inputs a `h-11 text-base`, botones de filtro/categoría a `h-10`, y verificar que ningún input dispare zoom automático en iOS Safari.

### Hallazgo 1: Botones de categorías en catálogo — `catalogo-productos.tsx` líneas ~159-201

Los filtros de categoría y el botón de promos se tocan decenas de veces por turno con `h-9` (36px).

```tsx
// ❌ Actual
<Button variant="..." size="sm" className="h-9 shrink-0">Pizzas</Button>

// ✅
<Button variant="..." size="sm" className="h-10 shrink-0">Pizzas</Button>
```

### Hallazgo 2: Input de fecha sin altura ni text-base — `lista-ordenes.tsx` línea ~229

iOS Safari hace zoom automático en inputs con `font-size < 16px`. El input de fecha tiene `h-9` y no declara `text-base`.

```tsx
// ❌ Actual
<input type="date" className="h-9 rounded-lg border ...">

// ✅
<input type="date" className="h-11 text-base rounded-lg border ...">
```

### Hallazgo 3: Inputs del formulario de pedido sin `text-base` explícito — `formulario-pedido-dialog.tsx`

Los `SelectTrigger` e `Input` tienen `h-12` (correcto en altura) pero no declaran `text-base`. Si el tema base de shadcn no lo incluye por defecto, iOS hará zoom al enfocar.

Afecta líneas: ~540, ~633, ~674, ~717, ~743, ~759

```tsx
// ✅ Agregar a todos los controles de entrada del formulario
<SelectTrigger className="h-12 text-base">
<Input className="h-12 text-base" />
<Textarea className="text-base" />
```

### Hallazgo 4: Altura de inputs inconsistente en formularios

`usuario-form.tsx` línea ~76 usa `h-10` (40px) en lugar de `h-11` (44px). Estandarizar todo el proyecto a `h-11` como mínimo para formularios de escritorio, `h-12` para POS.

| Componente | Actual | Correcto |
|------------|--------|----------|
| `usuario-form.tsx` inputs | `h-10` | `h-11` |
| `formulario-pedido-dialog.tsx` inputs | `h-12` ✅ | `h-12` |
| `lista-ordenes.tsx` date input | `h-9` | `h-11` |
| `catalogo-productos.tsx` búsqueda | `h-11` ✅ | `h-11` |

### Archivos a modificar:
- `components/pos/catalogo-productos.tsx`
- `components/ordenes/lista-ordenes.tsx`
- `components/pos/formulario-pedido-dialog.tsx`
- `components/usuarios/usuario-form.tsx`

### Commits esperados:
- [x] Subir botones de categoría de `h-9` a `h-10` en `catalogo-productos.tsx`
- [x] Corregir input de fecha a `h-11 text-base` en `lista-ordenes.tsx`
- [x] Agregar `text-base` a todos los `SelectTrigger` e `Input` en `formulario-pedido-dialog.tsx`
- [x] Estandarizar inputs de `usuario-form.tsx` a `h-11`

### Criterio de éxito:
- Ningún input tiene `font-size < 16px` (verificar en DevTools > Elements > Computed Styles en iOS)
- Todos los botones de filtro/categoría del POS tienen mínimo `h-10`
- Build pasa sin errores

---

## Release 34: Design Tokens — Colores Hardcodeados a Variables Semánticas

**Estado:** [x] Completado
**Dependencia:** Ninguna (transversal)
**Prioridad:** 🟠 Importante
**Objetivo:** Reemplazar los 43+ usos de colores utilitarios Tailwind hardcodeados (`bg-green-100`, `text-blue-700`) por los tokens semánticos del design system (`bg-success/10`, `text-info`). Esto garantiza que al cambiar la paleta del negocio todos los estados de color actualicen automáticamente.

### Contexto:
El design system en `globals.css` ya define variables semánticas: `--success`, `--warning`, `--info`, `--destructive`, `--primary`. Pero 43+ líneas en componentes usan colores Tailwind estáticos que no respetan el sistema de tokens ni el dark mode de forma consistente.

### Mapeo de colores de estado de órdenes

**Archivo:** `components/ordenes/estado-badge.tsx` líneas 9–32

```tsx
// ❌ Actual — colores hardcodeados que no cambian con la paleta
const ESTADO_ORDEN_CONFIG = {
  borrador:       { className: "bg-gray-100 text-gray-700 border-gray-200" },
  confirmada:     { className: "bg-blue-100 text-blue-700 border-blue-200" },
  en_preparacion: { className: "bg-amber-100 text-amber-700 border-amber-200" },
  lista:          { className: "bg-green-100 text-green-700 border-green-200" },
  entregada:      { className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelada:      { className: "bg-red-100 text-red-700 border-red-200" },
};

// ✅ Con tokens semánticos
const ESTADO_ORDEN_CONFIG = {
  borrador:       { className: "bg-muted text-muted-foreground border-border" },
  confirmada:     { className: "bg-info/10 text-info border-info/30" },
  en_preparacion: { className: "bg-warning/10 text-warning border-warning/30" },
  lista:          { className: "bg-success/10 text-success border-success/30" },
  entregada:      { className: "bg-success/15 text-success border-success/40" },
  cancelada:      { className: "bg-destructive/10 text-destructive border-destructive/30" },
};
```

### Archivos afectados con colores hardcodeados:

| Archivo | Líneas | Colores a reemplazar |
|---------|--------|----------------------|
| `ordenes/estado-badge.tsx` | 9–35 | gray, blue, amber, green, emerald, red → tokens semánticos |
| `dashboard/resumen-ventas.tsx` | 35–44 | text-blue-600, text-orange-600, text-indigo-600, text-purple-600 |
| `dashboard/pedidos-recientes.tsx` | 43–68 | bg-yellow-100, bg-blue-100, bg-green-100 |
| `caja/sesion-activa.tsx` | 54–58 | bg-green-50, border-green-200, bg-green-500 |
| `ordenes/tarjeta-orden.tsx` | ~179 | bg-purple-100 text-purple-700 |
| `reportes/tabla-cierres-caja.tsx` | ~80 | bg-green-100 text-green-700 |
| `dashboard/pedidos-programados.tsx` | varios | bg-purple-100 text-purple-700 |

### Variable a eliminar en `globals.css`:
- Línea ~16: `--color-primary-dark: #c62828;` — único color hex hardcodeado, nunca se usa
- Eliminar o convertir a HSL: `--primary-dark: 4 78% 37%;`

### Archivos a modificar:
- `app/globals.css` — eliminar variable hex sin usar
- `components/ordenes/estado-badge.tsx`
- `components/dashboard/resumen-ventas.tsx`
- `components/dashboard/pedidos-recientes.tsx`
- `components/caja/sesion-activa.tsx`
- `components/ordenes/tarjeta-orden.tsx`
- `components/reportes/tabla-cierres-caja.tsx`
- `components/dashboard/pedidos-programados.tsx`

### Commits esperados:
- [x] Eliminar `--color-primary-dark: #c62828` de `globals.css`
- [x] Reemplazar colores en `estado-badge.tsx` con tokens semánticos
- [x] Reemplazar colores en `resumen-ventas.tsx` y `pedidos-recientes.tsx`
- [x] Reemplazar colores en `sesion-activa.tsx` y `tarjeta-orden.tsx`
- [x] Reemplazar colores en `tabla-cierres-caja.tsx` y `pedidos-programados.tsx`
- [x] Verificar que dark mode sigue funcionando correctamente en todos los componentes

### Criterio de éxito:
- Ningún componente usa `bg-[color]-[shade]` o `text-[color]-[shade]` para estados semánticos (solo para decorativos justificados)
- Al cambiar a paleta `enterprise` en `globals.css`, todos los badges de estado actualizan su color automáticamente
- Build pasa sin errores

---

## Release 35: Arquitectura UI — Atomic Design y Componentes Compartidos

**Estado:** [ ] Pendiente
**Dependencia:** Ninguna (transversal, bajo riesgo)
**Prioridad:** 🟡 Sugerencia
**Objetivo:** Corregir la jerarquía de componentes según Atomic Design: mover el componente mal ubicado en `shared/`, consolidar el patrón de badge de estado duplicado en 6+ lugares, mover `stats-card` a `shared/` y hacer que los estados vacíos usen el componente `EmptyState` ya existente.

### Hallazgo 1: `sucursal-selector.tsx` en `shared/` con lógica de negocio

`components/shared/sucursal-selector.tsx` línea ~4 importa `useSucursal()` hook con estado global de negocio. No cumple el criterio de molécula genérica.

```
De: components/shared/sucursal-selector.tsx
A:  components/layout/sucursal-selector.tsx
```

Actualizar todos los imports en `app-header.tsx` y otros consumidores.

### Hallazgo 2: Patrón de badge de estado duplicado 6+ veces

El mismo patrón `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium` se reimplementa en:
- `ordenes/tarjeta-orden.tsx` línea ~179
- `dashboard/pedidos-recientes.tsx` líneas 43–68
- `reportes/tabla-cierres-caja.tsx` línea ~80
- `dashboard/pedidos-programados.tsx` varios
- Y otros

**Fix:** Crear `components/shared/status-badge.tsx` parametrizable:

```tsx
// components/shared/status-badge.tsx
interface StatusBadgeProps {
  label: string;
  className?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

export function StatusBadge({ label, className, icon, size = "sm" }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium",
      size === "sm" ? "text-xs" : "text-sm",
      className
    )}>
      {icon}
      {label}
    </span>
  );
}
```

`estado-badge.tsx` pasa a usar `StatusBadge` internamente, manteniendo su interfaz actual.

### Hallazgo 3: `stats-card.tsx` es suficientemente genérico para `shared/`

`components/dashboard/stats-card.tsx` es un componente puramente presentacional (título + valor + ícono + tendencia) sin ningún conocimiento del dominio. El mismo patrón se reimplementa en `caja/sesion-activa.tsx` (~línea 157) y `reportes/resumen-cards.tsx`.

```
De: components/dashboard/stats-card.tsx
A:  components/shared/metric-card.tsx
```

Actualizar imports en `dashboard/resumen-ventas.tsx`, `caja/sesion-activa.tsx` y `reportes/resumen-cards.tsx`.

### Hallazgo 4: 20+ estados vacíos inline que ignoran `EmptyState` shared

`components/shared/empty-state.tsx` existe pero los componentes implementan su propio estado vacío. Archivos que deben actualizarse:
- `components/dashboard/pedidos-recientes.tsx` línea ~82
- `components/dashboard/grafico-ventas-tipo.tsx` línea ~76
- `components/reportes/tabla-ventas-detalle.tsx` línea ~37
- `components/reportes/tabla-top-productos.tsx` línea ~25
- `components/productos/productos-table.tsx` línea ~156
- `components/usuarios/usuarios-tabla.tsx` línea ~129
- Y ~14 más

### Archivos a crear:
- `components/shared/status-badge.tsx` (nuevo)

### Archivos a mover/renombrar:
- `components/shared/sucursal-selector.tsx` → `components/layout/sucursal-selector.tsx`
- `components/dashboard/stats-card.tsx` → `components/shared/metric-card.tsx`

### Archivos a modificar:
- `components/layout/app-header.tsx` — actualizar import de sucursal-selector
- `components/dashboard/resumen-ventas.tsx` — usar metric-card desde shared
- `components/caja/sesion-activa.tsx` — usar metric-card desde shared
- `components/ordenes/estado-badge.tsx` — usar StatusBadge internamente
- `components/dashboard/pedidos-recientes.tsx` — usar StatusBadge + EmptyState
- Los ~20 componentes con estados vacíos inline → usar `<EmptyState>`

### Commits esperados:
- [ ] Mover `sucursal-selector.tsx` de `shared/` a `layout/`, actualizar imports
- [ ] Crear `components/shared/status-badge.tsx`
- [ ] Actualizar `estado-badge.tsx` para usar `StatusBadge` internamente
- [ ] Reemplazar badges duplicados en dashboard y reportes por `StatusBadge`
- [ ] Mover `stats-card.tsx` a `shared/metric-card.tsx`, actualizar los 3 consumidores
- [ ] Reemplazar estados vacíos inline por `<EmptyState>` en los 20+ componentes

### Criterio de éxito:
- No existe `components/shared/sucursal-selector.tsx` (movido a layout)
- `components/shared/status-badge.tsx` existe y es usado por `estado-badge.tsx` y otros
- `components/shared/metric-card.tsx` existe y reemplaza `dashboard/stats-card.tsx`
- No hay implementaciones inline de estado vacío que no usen `<EmptyState>`
- Build pasa sin errores

---

## Release 36: Refinamientos de Layout, Tipografía y UX General

**Estado:** [ ] Pendiente
**Dependencia:** Ninguna (transversal, riesgo mínimo)
**Prioridad:** 🟡 Sugerencia / ⚪ Nit
**Objetivo:** Corregir una serie de detalles menores de layout, tipografía y UX detectados en auditoría: padding del header sin breakpoint, ancho fijo del dropdown, posición del toaster en móvil, `tabular-nums` en stats cards, exceso de texto `text-xs` en tarjeta de orden, logo sin tipografía escalable, y agregar skeletons de carga donde falten.

### Hallazgo 1: Header padding sin breakpoint — `app-header.tsx` línea ~36

```tsx
// ❌ Actual — padding fijo para todos los tamaños
<header className="flex h-14 items-center gap-4 border-b bg-card px-4">

// ✅ Escala con el viewport
<header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
```

### Hallazgo 2: Dropdown ancho fijo en viewport < 320px — `app-header.tsx` línea ~84

```tsx
// ❌ Puede salir del viewport en pantallas muy pequeñas
<DropdownMenuContent align="end" className="w-56">

// ✅
<DropdownMenuContent align="end" className="w-48 sm:w-56">
```

### Hallazgo 3: Toaster position fija en `top-right` — `app/layout.tsx` línea ~49

En móvil el toast puede solaparse con el botón hamburguesa del sidebar.

```tsx
// ❌ Actual
<Toaster position="top-right" />

// ✅ Bottom en móvil, top-right en desktop
<Toaster position="bottom-right" toastOptions={{ className: "md:top-right" }} />
// O simplemente:
<Toaster position="bottom-center" />
```

### Hallazgo 4: Stats cards sin `tabular-nums` — `stats-card.tsx` línea ~28

Los valores monetarios del dashboard "saltan" visualmente cuando cambian entre filtros porque los dígitos no tienen ancho fijo.

```tsx
// ❌ Actual
<p className="text-2xl font-bold tracking-tight">{value}</p>

// ✅
<p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
```

### Hallazgo 5: Texto `text-xs` excesivo en `tarjeta-orden.tsx` líneas 188–344

Los metadatos de hora/cajero/mesa/sucursal (línea ~188), información de delivery (línea ~295) y descuentos con `text-[11px]` (línea ~344) usan tamaños difíciles de leer en móvil. Subir metadatos principales a `text-sm`.

```tsx
// ❌ text-[11px] para precios y descuentos
<span className="text-[11px] text-muted-foreground">

// ✅ text-xs como mínimo, text-sm para datos operativos
<span className="text-xs text-muted-foreground">
// Para precios con descuento — siempre legible
<span className="text-sm text-muted-foreground tabular-nums">
```

### Hallazgo 6: Logo "DANI PIZZAS" sin tipografía responsive — `app-sidebar.tsx` línea ~54

```tsx
// ❌ Tamaño fijo
<span className="text-lg font-bold text-primary">DANI PIZZAS</span>

// ✅ Responsive
<span className="text-base sm:text-lg font-bold text-primary">DANI PIZZAS</span>
```

### Hallazgo 7: Skeletons de carga poco utilizados

El componente `Skeleton` existe en `components/ui/skeleton.tsx` pero las secciones principales del dashboard y la lista de órdenes no los usan mientras cargan datos. Para un POS con UX percibida rápida, implementar skeletons en al menos:
- `components/dashboard/resumen-ventas.tsx` — skeleton de las 4 stats cards
- `components/ordenes/lista-ordenes.tsx` — skeleton de tarjetas de orden
- `app/(dashboard)/dashboard/loading.tsx` — archivo de loading de Next.js

### Archivos a modificar:
- `components/layout/app-header.tsx` — padding y dropdown
- `app/layout.tsx` — posición del toaster
- `components/shared/metric-card.tsx` (o `dashboard/stats-card.tsx`) — tabular-nums
- `components/ordenes/tarjeta-orden.tsx` — escalar text-xs a text-sm donde corresponda
- `components/layout/app-sidebar.tsx` — logo responsive
- `components/dashboard/resumen-ventas.tsx` — agregar skeleton state
- `app/(dashboard)/dashboard/loading.tsx` (nuevo)

### Commits esperados:
- [ ] Agregar `md:px-6` al header y `w-48 sm:w-56` al dropdown
- [ ] Cambiar posición del Toaster para mejor UX en móvil
- [ ] Agregar `tabular-nums` a valores numéricos en stats cards
- [ ] Subir metadatos de `tarjeta-orden.tsx` de `text-[11px]`/`text-xs` a `text-xs`/`text-sm`
- [ ] Escalar logo del sidebar con `text-base sm:text-lg`
- [ ] Crear `app/(dashboard)/dashboard/loading.tsx` con skeleton de stats cards
- [ ] Agregar skeletons al menos en lista de órdenes

### Criterio de éxito:
- El header tiene padding adecuado en desktop (md:px-6)
- Los toasts no se solapan con el botón hamburguesa en móvil
- Los números del dashboard no "saltan" al cambiar de filtro
- Metadatos de tarjeta de orden son legibles en 375px
- Al navegar al dashboard hay un skeleton visible antes de los datos
- Build pasa sin errores

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
