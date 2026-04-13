/** Utilidades puras para promociones — sin dependencias de servidor */

import type { TipoPromocion } from "@/lib/constants";

export type PromocionBase = {
  nombre?: string;
  activa: boolean | null;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_promocion: TipoPromocion;
  valor_descuento: number;
  dias_semana: number[] | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  pedido_minimo: number | null;
  precio_combo: number | null;
  productos_ids: string[];
  medidas_ids: string[];
  tipos_pedido?: string[] | null;
  permite_modificaciones?: boolean;
  nivel_membresia_id?: string | null;
  precio_dinamico?: boolean;
  sabores_ids: string[];
  // Backward compat
  tipo_descuento: string;
};

/** Verifica si una promo es accesible para un cliente según su nivel de membresía */
export function promoAccesibleParaCliente(
  promo: PromocionBase,
  nivelClienteId: string | null,
): boolean {
  // Si la promo no tiene restricción de nivel → accesible para todos
  if (!promo.nivel_membresia_id) return true;
  // Si la promo requiere nivel pero el cliente no tiene membresía → no accesible
  if (!nivelClienteId) return false;
  // El cliente debe tener el nivel exacto de la promo
  return promo.nivel_membresia_id === nivelClienteId;
}

/** Verifica si una promoción aplica a un tipo de pedido */
export function promoAplicaATipoPedido(
  promo: PromocionBase,
  tipoPedido: string,
): boolean {
  if (!promo.tipos_pedido || promo.tipos_pedido.length === 0) return true;
  return promo.tipos_pedido.includes(tipoPedido);
}

export type ItemCarrito = {
  producto_id: string;
  variante_id?: string | null;
  medida_id?: string | null;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
};

/** Obtiene la fecha/hora actual en zona horaria Lima (UTC-5) */
function getNowLima(): Date {
  // Crear fecha en zona Lima usando toLocaleString
  const nowStr = new Date().toLocaleString("en-US", {
    timeZone: "America/Lima",
  });
  return new Date(nowStr);
}

/** Verifica si una promoción está vigente (fecha + día + hora) */
export function esPromocionVigente(promo: PromocionBase): boolean {
  if (!promo.activa) return false;

  const now = new Date();
  const nowLima = getNowLima();

  // Rango de fechas (comparar en UTC ya que las fechas se almacenan en UTC)
  const inicio = new Date(promo.fecha_inicio);
  const fin = new Date(promo.fecha_fin);
  if (now < inicio || now > fin) return false;

  // Días de la semana (usar hora de Lima para determinar el día correcto)
  if (promo.dias_semana && promo.dias_semana.length > 0) {
    const diaSemana = nowLima.getDay(); // 0=dom, 6=sab en hora Lima
    if (!promo.dias_semana.includes(diaSemana)) return false;
  }

  // Horario (usar hora de Lima)
  if (promo.hora_inicio && promo.hora_fin) {
    const horaActual = `${nowLima.getHours().toString().padStart(2, "0")}:${nowLima.getMinutes().toString().padStart(2, "0")}`;
    if (
      horaActual < promo.hora_inicio.slice(0, 5) ||
      horaActual > promo.hora_fin.slice(0, 5)
    )
      return false;
  }

  return true;
}

/**
 * Verifica si un item del carrito coincide con los filtros de la promo.
 * - Si la promo tiene productos_ids: el item debe estar en la lista
 * - Si la promo tiene medidas_ids: el item debe tener esa medida
 * - Si tiene ambos: debe cumplir ambos
 * - Si no tiene ninguno: coincide con todo
 */
function itemCoincideConPromo(
  promo: PromocionBase,
  item: ItemCarrito,
): boolean {
  const tieneProductos = promo.productos_ids.length > 0;
  const tieneMedidas = promo.medidas_ids.length > 0;

  if (!tieneProductos && !tieneMedidas) return true;

  const coincideProducto = tieneProductos
    ? promo.productos_ids.includes(item.producto_id)
    : true;
  const coincideMedida = tieneMedidas
    ? !!item.medida_id && promo.medidas_ids.includes(item.medida_id)
    : true;

  return coincideProducto && coincideMedida;
}

/** Verifica si la promoción es aplicable al carrito actual */
export function esPromocionAplicableAlCarrito(
  promo: PromocionBase,
  items: ItemCarrito[],
  subtotal: number,
  deliveryFee: number,
): boolean {
  switch (promo.tipo_promocion) {
    case "descuento_porcentaje":
    case "descuento_fijo": {
      if (promo.pedido_minimo && subtotal < promo.pedido_minimo) return false;
      const tieneFilteros =
        promo.productos_ids.length > 0 || promo.medidas_ids.length > 0;
      if (tieneFilteros) {
        return items.some((i) => itemCoincideConPromo(promo, i));
      }
      return true;
    }
    case "2x1": {
      const elegibles = items.filter((i) => itemCoincideConPromo(promo, i));
      const totalCantidad = elegibles.reduce((acc, i) => acc + i.cantidad, 0);
      return totalCantidad >= 2;
    }
    case "combo_precio_fijo": {
      return promo.productos_ids.every((pid) =>
        items.some(
          (i) => i.producto_id === pid && itemCoincideConPromo(promo, i),
        ),
      );
    }
    case "delivery_gratis": {
      // Necesita delivery fee > 0 y subtotal >= pedido_minimo
      if (deliveryFee <= 0) return false;
      if (promo.pedido_minimo && subtotal < promo.pedido_minimo) return false;
      return true;
    }
    default:
      return true;
  }
}

/** Calcula el monto de descuento según el tipo de promoción */
export function calcularDescuento(
  promo: PromocionBase,
  items: ItemCarrito[],
  subtotal: number,
  deliveryFee: number,
): number {
  switch (promo.tipo_promocion) {
    case "descuento_porcentaje": {
      const tieneFiltros =
        promo.productos_ids.length > 0 || promo.medidas_ids.length > 0;
      if (tieneFiltros) {
        const subtotalElegible = items
          .filter((i) => itemCoincideConPromo(promo, i))
          .reduce((acc, i) => acc + i.subtotal, 0);
        return (
          Math.round(((subtotalElegible * promo.valor_descuento) / 100) * 100) /
          100
        );
      }
      return Math.round(((subtotal * promo.valor_descuento) / 100) * 100) / 100;
    }

    case "descuento_fijo": {
      if (promo.pedido_minimo && subtotal < promo.pedido_minimo) return 0;
      return Math.min(promo.valor_descuento, subtotal);
    }

    case "2x1": {
      const elegibles: number[] = [];
      for (const item of items) {
        if (itemCoincideConPromo(promo, item)) {
          for (let q = 0; q < item.cantidad; q++) {
            elegibles.push(item.precio_unitario);
          }
        }
      }
      elegibles.sort((a, b) => b - a);

      let descuento = 0;
      for (let i = 1; i < elegibles.length; i += 2) {
        descuento += elegibles[i];
      }
      return Math.round(descuento * 100) / 100;
    }

    case "combo_precio_fijo": {
      if (!promo.precio_combo) return 0;
      const todosPresentes = promo.productos_ids.every((pid) =>
        items.some(
          (i) => i.producto_id === pid && itemCoincideConPromo(promo, i),
        ),
      );
      if (!todosPresentes) return 0;

      const subtotalCombo = items
        .filter((i) => itemCoincideConPromo(promo, i))
        .reduce((acc, i) => acc + i.subtotal, 0);

      return Math.max(
        0,
        Math.round((subtotalCombo - promo.precio_combo) * 100) / 100,
      );
    }

    case "delivery_gratis": {
      if (promo.pedido_minimo && subtotal < promo.pedido_minimo) return 0;
      return deliveryFee;
    }

    default:
      return 0;
  }
}

/** Genera texto legible de la promoción */
export function getDescripcionPromocion(
  promo: PromocionBase,
  formatCurrency: (n: number) => string,
): string {
  switch (promo.tipo_promocion) {
    case "descuento_porcentaje":
      return `${promo.valor_descuento}% de descuento`;
    case "descuento_fijo":
      return `${formatCurrency(promo.valor_descuento)} de descuento${promo.pedido_minimo ? ` en pedidos mayores a ${formatCurrency(promo.pedido_minimo)}` : ""}`;
    case "2x1":
      return "Lleva 2, paga 1";
    case "combo_precio_fijo":
      return `Combo por ${formatCurrency(promo.precio_combo ?? 0)}`;
    case "delivery_gratis":
      return `Delivery gratis${promo.pedido_minimo ? ` en pedidos mayores a ${formatCurrency(promo.pedido_minimo)}` : ""}`;
    default:
      return "";
  }
}

// ─── Detección de promo por producto/variante ─────────────────────────────

/** Resultado de detección de promo para un producto/variante */
export type PromoDetectada = {
  promo: PromocionBase;
  precioOriginal: number;
  precioConPromo: number;
  descuento: number;
  etiqueta: string;
};

/**
 * Detecta la mejor promo de descuento aplicable a un producto+medida.
 * Solo aplica a descuento_porcentaje y descuento_fijo (auto-aplicables).
 * 2x1, combo y delivery_gratis se muestran como badge informativo sin precio.
 */
export function detectarPromoParaVariante(
  promos: PromocionBase[],
  productoId: string,
  medidaId: string | null,
  precioVariante: number,
): PromoDetectada | null {
  let mejor: PromoDetectada | null = null;

  for (const promo of promos) {
    // Excluir promos exclusivas de membresía (se aplican en el formulario, no automáticamente)
    if (promo.nivel_membresia_id) continue;
    const itemSimulado: ItemCarrito = {
      producto_id: productoId,
      medida_id: medidaId,
      precio_unitario: precioVariante,
      cantidad: 1,
      subtotal: precioVariante,
    };

    if (!itemCoincideConPromo(promo, itemSimulado)) continue;

    let descuento = 0;
    let etiqueta = "PROMO";

    switch (promo.tipo_promocion) {
      case "descuento_porcentaje":
        descuento =
          Math.round(((precioVariante * promo.valor_descuento) / 100) * 100) /
          100;
        etiqueta = `-${promo.valor_descuento}%`;
        break;
      case "descuento_fijo":
        descuento = Math.min(promo.valor_descuento, precioVariante);
        etiqueta = "PROMO";
        break;
      case "2x1":
        etiqueta = "2x1";
        break;
      case "combo_precio_fijo":
        etiqueta = "COMBO";
        break;
      case "delivery_gratis":
        continue;
    }

    const precioConPromo = Math.max(0, precioVariante - descuento);

    if (!mejor || descuento > mejor.descuento) {
      mejor = {
        promo,
        precioOriginal: precioVariante,
        precioConPromo,
        descuento,
        etiqueta,
      };
    }
  }

  return mejor;
}

/**
 * Detecta si alguna promo aplica a un producto (cualquier variante).
 * Para badge informativo en el catálogo.
 */
export function productoTienePromo(
  promos: PromocionBase[],
  productoId: string,
): { tienePromo: boolean; etiqueta: string } {
  for (const promo of promos) {
    // Excluir promos exclusivas de membresía
    if (promo.nivel_membresia_id) continue;
    const tieneProductos = promo.productos_ids.length > 0;
    if (tieneProductos && !promo.productos_ids.includes(productoId)) continue;
    switch (promo.tipo_promocion) {
      case "descuento_porcentaje":
        return { tienePromo: true, etiqueta: `-${promo.valor_descuento}%` };
      case "descuento_fijo":
        return { tienePromo: true, etiqueta: "PROMO" };
      case "2x1":
        return { tienePromo: true, etiqueta: "2x1" };
      case "combo_precio_fijo":
        return { tienePromo: true, etiqueta: "COMBO" };
      default:
        continue;
    }
  }
  return { tienePromo: false, etiqueta: "" };
}
