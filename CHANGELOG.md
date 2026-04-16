# CHANGELOG - DANI PIZZAS

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

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
