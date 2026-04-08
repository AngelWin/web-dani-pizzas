/** Utilidades puras para promociones — sin dependencias de servidor */

export type PromocionBase = {
  activa: boolean | null;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_descuento: string;
  valor_descuento: number;
};

/** Verifica si una promoción está vigente en este momento */
export function esPromocionVigente(promo: PromocionBase): boolean {
  if (!promo.activa) return false;
  const now = new Date();
  const inicio = new Date(promo.fecha_inicio);
  const fin = new Date(promo.fecha_fin);
  return now >= inicio && now <= fin;
}

/** Calcula el monto de descuento para un subtotal dado */
export function calcularDescuento(
  promo: PromocionBase,
  subtotal: number,
): number {
  if (promo.tipo_descuento === "porcentaje") {
    return Math.round(((subtotal * promo.valor_descuento) / 100) * 100) / 100;
  }
  return Math.min(promo.valor_descuento, subtotal);
}
