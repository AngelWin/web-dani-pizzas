// Funciones puras de cálculo — sin imports de servidor, usables en Client Components

export type NivelMembresiaCalculo = {
  descuento_porcentaje: number | null;
};

export function calcularDescuentoNivel(
  subtotal: number,
  nivel: NivelMembresiaCalculo | null,
): number {
  if (!nivel || !nivel.descuento_porcentaje) return 0;
  return Math.round(subtotal * (nivel.descuento_porcentaje / 100) * 100) / 100;
}

export function calcularPuntosVenta(
  total: number,
  reglas: {
    activa: boolean | null;
    soles_por_punto: number;
    puntos_otorgados: number;
  }[],
): number {
  const reglaActiva = reglas
    .filter((r) => r.activa)
    .sort((a, b) => a.soles_por_punto - b.soles_por_punto)[0];
  if (!reglaActiva) return 0;
  return (
    Math.floor(total / reglaActiva.soles_por_punto) *
    reglaActiva.puntos_otorgados
  );
}
