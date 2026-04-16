"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type RealtimeTable = {
  tabla: string;
  sucursalId?: string | null;
  /** Campo por el que filtrar. Default: "sucursal_id" */
  campoFiltro?: string;
};

/**
 * Hook genérico que escucha cambios en una o varias tablas de Supabase
 * y llama a router.refresh() para que los Server Components re-fetchen
 * datos frescos automáticamente.
 *
 * Uso:
 *   useRealtimeRefresh([
 *     { tabla: "ordenes", sucursalId },
 *     { tabla: "ventas", sucursalId },
 *   ]);
 */
export function useRealtimeRefresh(tablas: RealtimeTable[]) {
  const router = useRouter();

  useEffect(() => {
    if (tablas.length === 0) return;

    const supabase = createClient();
    const channelName = `realtime-${tablas.map((t) => t.tabla).join("-")}-${Date.now()}`;

    let channel = supabase.channel(channelName);

    for (const { tabla, sucursalId, campoFiltro = "sucursal_id" } of tablas) {
      const filter = sucursalId ? `${campoFiltro}=eq.${sucursalId}` : undefined;

      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: tabla,
          ...(filter ? { filter } : {}),
        },
        () => {
          router.refresh();
        },
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablas.map((t) => `${t.tabla}:${t.sucursalId}`).join(",")]);
}
