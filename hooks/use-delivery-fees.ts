"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_DELIVERY_FEES } from "@/lib/constants";

type DeliveryFees = {
  propio: number;
  tercero: number;
};

export function useDeliveryFees(sucursalId: string | null) {
  const [fees, setFees] = useState<DeliveryFees>(DEFAULT_DELIVERY_FEES);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!sucursalId) return;

    async function fetchFees() {
      setIsLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("delivery_fees_config")
        .select("tipo, monto")
        .eq("sucursal_id", sucursalId!);

      const result: DeliveryFees = { ...DEFAULT_DELIVERY_FEES };
      for (const row of data ?? []) {
        if (row.tipo === "propio") result.propio = row.monto;
        if (row.tipo === "tercero") result.tercero = row.monto;
      }
      setFees(result);
      setIsLoading(false);
    }

    fetchFees();
  }, [sucursalId]);

  return { fees, isLoading };
}
