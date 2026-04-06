---
paths: "app/**/pos/**/*.tsx,app/**/pos/**/*.ts,components/pos/**/*"
---

# Reglas del POS - DANI PIZZAS

## Interacción

- Diseño touch-friendly: botones grandes (`h-12` mínimo, `h-14` preferido)
- Áreas de toque amplias, separación adecuada entre elementos clickeables
- Optimizado para tablet y PC táctil
- Feedback visual inmediato en cada interacción

## Tipos de Pedido

1. **Para llevar** — Sin campos adicionales
2. **En local** — Mesa o referencia
3. **Delivery** — Campos adicionales obligatorios:
   - Método: Propio o Tercero
   - Si Propio → seleccionar repartidor de la sucursal
   - Si Tercero → nombre del servicio (Rappi, PedidosYa, Glovo, Otro)
   - Costo de delivery (auto-llenado desde `delivery_fees_config`, editable)
     - Propio: 3 soles default
     - Tercero: 4 soles default
   - Dirección completa + referencia
   - Sucursal de origen: automática
   - Estado: Pendiente → En camino → Entregado (con timestamp)

## Flujo de Venta

1. Seleccionar productos del catálogo
2. Ajustar cantidades
3. Aplicar promoción/membresía si aplica
4. Elegir tipo de pedido
5. Registrar pago
6. Confirmar e imprimir ticket
