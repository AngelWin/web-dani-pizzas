"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type DeliveryServicioClient = {
  id: string;
  nombre: string;
  tipo: "propio" | "tercero";
  precio_base: number;
};

export function useDeliveryServicios(sucursalId: string | null) {
  const [servicios, setServicios] = useState<DeliveryServicioClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!sucursalId) return;

    async function fetchServicios() {
      setIsLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("delivery_servicios")
        .select("id, nombre, tipo, precio_base")
        .eq("sucursal_id", sucursalId!)
        .eq("activo", true)
        .order("orden");

      setServicios(
        (data ?? []).map((s) => ({
          id: s.id,
          nombre: s.nombre,
          tipo: s.tipo as "propio" | "tercero",
          precio_base: s.precio_base,
        })),
      );
      setIsLoading(false);
    }

    fetchServicios();
  }, [sucursalId]);

  return { servicios, isLoading };
}
