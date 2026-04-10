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
- [x] POS: ConfiguradorPizzaDialog (selector multi-paso: tamaño → sabores → exclusiones/extras)
- [x] POS: catalogo-productos detecta categorias con sabores y abre configurador
- [x] POS: carrito muestra desglose de sabores, exclusiones y extras
- [x] POS: crearOrdenAction y crearOrden persisten sabores y extras en orden_items
- [x] Ordenes: tarjeta-orden muestra desglose de pizza (proporciones, exclusiones, extras)

### Criterio de exito:
- Admin puede definir sabores con ingredientes para categorias de pizza
- Admin puede marcar medidas Familiar y Extra como combinables
- Admin puede definir extras pagados por categoria
- En POS, al tocar una pizza → se abre ConfiguradorPizzaDialog
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

**Estado:** [ ] Pendiente
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
