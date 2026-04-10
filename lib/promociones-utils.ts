/** Utilidades puras para promociones — sin dependencias de servidor */

import type { TipoPromocion } from "@/lib/constants";

export type PromocionBase = {
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
  // Backward compat
  tipo_descuento: string;
};

export type ItemCarrito = {
  producto_id: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
};

/** Verifica si una promoción está vigente (fecha + día + hora) */
export function esPromocionVigente(promo: PromocionBase): boolean {
  if (!promo.activa) return false;

  const now = new Date();

  // Rango de fechas
  const inicio = new Date(promo.fecha_inicio);
  const fin = new Date(promo.fecha_fin);
  if (now < inicio || now > fin) return false;

  // Días de la semana
  if (promo.dias_semana && promo.dias_semana.length > 0) {
    const diaSemana = now.getDay(); // 0=dom, 6=sab
    if (!promo.dias_semana.includes(diaSemana)) return false;
  }

  // Horario
  if (promo.hora_inicio && promo.hora_fin) {
    const horaActual = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    if (
      horaActual < promo.hora_inicio.slice(0, 5) ||
      horaActual > promo.hora_fin.slice(0, 5)
    )
      return false;
  }

  return true;
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
      // Si tiene pedido mínimo, verificar
      if (promo.pedido_minimo && subtotal < promo.pedido_minimo) return false;
      // Si tiene productos, verificar que al menos uno esté en el carrito
      if (promo.productos_ids.length > 0) {
        return items.some((i) => promo.productos_ids.includes(i.producto_id));
      }
      return true;
    }
    case "2x1": {
      // Necesita al menos 2 items de productos elegibles
      const elegibles = items.filter((i) =>
        promo.productos_ids.includes(i.producto_id),
      );
      const totalCantidad = elegibles.reduce((acc, i) => acc + i.cantidad, 0);
      return totalCantidad >= 2;
    }
    case "combo_precio_fijo": {
      // Todos los productos del combo deben estar en el carrito
      return promo.productos_ids.every((pid) =>
        items.some((i) => i.producto_id === pid),
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
      if (promo.productos_ids.length > 0) {
        // Solo sobre productos elegibles
        const subtotalElegible = items
          .filter((i) => promo.productos_ids.includes(i.producto_id))
          .reduce((acc, i) => acc + i.subtotal, 0);
        return (
          Math.round(((subtotalElegible * promo.valor_descuento) / 100) * 100) /
          100
        );
      }
      // Sobre todo el subtotal
      return Math.round(((subtotal * promo.valor_descuento) / 100) * 100) / 100;
    }

    case "descuento_fijo": {
      if (promo.pedido_minimo && subtotal < promo.pedido_minimo) return 0;
      return Math.min(promo.valor_descuento, subtotal);
    }

    case "2x1": {
      // Expandir items por cantidad y ordenar por precio DESC
      const elegibles: number[] = [];
      for (const item of items) {
        if (promo.productos_ids.includes(item.producto_id)) {
          for (let q = 0; q < item.cantidad; q++) {
            elegibles.push(item.precio_unitario);
          }
        }
      }
      elegibles.sort((a, b) => b - a);

      // Cada 2 items, el segundo (más barato) es gratis
      let descuento = 0;
      for (let i = 1; i < elegibles.length; i += 2) {
        descuento += elegibles[i];
      }
      return Math.round(descuento * 100) / 100;
    }

    case "combo_precio_fijo": {
      if (!promo.precio_combo) return 0;
      // Verificar que todos los productos del combo están
      const todosPresentes = promo.productos_ids.every((pid) =>
        items.some((i) => i.producto_id === pid),
      );
      if (!todosPresentes) return 0;

      // Subtotal de los productos del combo
      const subtotalCombo = items
        .filter((i) => promo.productos_ids.includes(i.producto_id))
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
