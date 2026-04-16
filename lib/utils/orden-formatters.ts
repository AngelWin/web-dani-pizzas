import type { Json } from "@/types/database";

export type SaborOrdenJson = {
  sabor_id: string;
  sabor_nombre: string;
  proporcion: string;
  exclusiones: string[];
};

export type ExtraOrdenJson = {
  extra_id: string;
  nombre: string;
  precio: number;
};

export type AcompananteOrdenJson = {
  variante_id: string;
  variante_nombre: string;
  sabor_id: string;
  sabor_nombre: string;
};

export function parseSabores(raw: Json | null): SaborOrdenJson[] {
  if (!Array.isArray(raw)) return [];
  return raw as SaborOrdenJson[];
}

export function parseExtras(raw: Json | null): ExtraOrdenJson[] {
  if (!Array.isArray(raw)) return [];
  return raw as ExtraOrdenJson[];
}

export function parseAcompanante(
  raw: Json | null,
): AcompananteOrdenJson | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as AcompananteOrdenJson;
}

export function formatEntregaProgramada(isoString: string): string {
  const fecha = new Date(isoString);
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);

  const esHoy =
    fecha.toLocaleDateString("es-PE") === hoy.toLocaleDateString("es-PE");
  const esManana =
    fecha.toLocaleDateString("es-PE") === manana.toLocaleDateString("es-PE");

  const hora = fecha.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (esHoy) return `Hoy ${hora}`;
  if (esManana) return `Mañana ${hora}`;

  return fecha.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
