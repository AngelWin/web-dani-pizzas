# CHANGELOG - DANI PIZZAS

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

---

## [v1.1.0] - 2026-04-21

### R40 — Impresión Térmica Bluetooth

#### Agregado
- Conexión Bluetooth a impresora térmica BIENEX 80mm desde Chrome/Edge (Web Bluetooth API)
- Indicador de estado de impresora en el header del dashboard (verde/ámbar/gris)
- Preview visual del ticket antes de imprimir (simula papel 80mm en pantalla)
- Impresión de ticket de orden desde `/ordenes` (botón en cada orden)
- Impresión de comanda de cocina al avanzar orden a "En preparación"
- Impresión de ticket post-cobro con método de pago y vuelto
- Impresión de ticket post-creación desde el POS
- Impresión de cuenta de mesa agrupada desde `/ordenes`
- Auto-impresión al cobrar si hay impresora conectada
- Descarga del ticket como imagen PNG para envío por WhatsApp (botón "Descargar" en cada orden)
- Descarga de cuenta de mesa como imagen PNG
- Soporte de degradación elegante en Firefox/Safari: preview funciona, impresión muestra mensaje de compatibilidad

#### Correcciones técnicas (durante R40)
- Imagen descargada ya no aparece recortada — se captura desde elemento off-screen sin restricciones de overflow

---

## [v1.0.1] - 2026-04-16

### Correcciones visuales + Realtime

#### Agregado
- Realtime en `/ordenes`: el cajero ve nuevas órdenes sin recargar
- Realtime en `/caja`: el resumen se actualiza al llegar nuevas ventas o cambiar el estado de la sesión
- Realtime en `/pos`: el selector de mesas, catálogo de productos y estado de caja se sincronizan automáticamente
- Realtime en `/dashboard`: estadísticas y pedidos recientes se actualizan en vivo
- Realtime en `/entregas`: la tabla de deliveries refleja cambios de estado al instante
- Hook genérico `use-realtime-refresh` para suscripción a tablas de Supabase
- Componente `RealtimeRefresh` para páginas Server Component

#### Corregido
- Versión `v1.0.0` movida a la esquina superior izquierda del login con tamaño más visible
- Color de versión en sidebar con mejor contraste

---

## [v1.0.0] - 2026-04-16

### Primera versión estable del sistema

#### Agregado
- Archivo CHANGELOG.md para historial de versiones
- Versión `v1.0.0` visible en la página de login
- Versión `v1.0.0` visible al final del Sidebar (después de Configuración)
