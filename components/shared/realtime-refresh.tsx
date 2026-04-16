"use client";

import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";

type Tabla = {
  tabla: string;
  sucursalId?: string | null;
  campoFiltro?: string;
};

type Props = {
  tablas: Tabla[];
};

/**
 * Componente invisible que activa Supabase Realtime en páginas Server Component.
 * Colocarlo dentro de la página como hijo; escucha cambios y llama router.refresh().
 *
 * Ejemplo:
 *   <RealtimeRefresh tablas={[{ tabla: "ordenes", sucursalId }]} />
 */
export function RealtimeRefresh({ tablas }: Props) {
  useRealtimeRefresh(tablas);
  return null;
}
