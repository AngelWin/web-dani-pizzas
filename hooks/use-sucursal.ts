"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];

export function useSucursal() {
  const { sucursal, role } = useAuth();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [selectedSucursalId, setSelectedSucursalId] = useState<string | null>(
    sucursal?.id ?? null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = role === "administrador";

  // Cargar todas las sucursales si es admin
  useEffect(() => {
    if (!isAdmin) {
      if (sucursal) {
        setSucursales([sucursal]);
        setSelectedSucursalId(sucursal.id);
      }
      return;
    }

    async function fetchSucursales() {
      setIsLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("sucursales")
        .select("*")
        .eq("activa", true)
        .order("nombre")
        .returns<Sucursal[]>();

      if (data) {
        setSucursales(data);
        if (!selectedSucursalId && data.length > 0) {
          setSelectedSucursalId(data[0].id);
        }
      }
      setIsLoading(false);
    }

    fetchSucursales();
  }, [isAdmin, sucursal, selectedSucursalId]);

  const selectSucursal = useCallback((id: string) => {
    setSelectedSucursalId(id);
  }, []);

  const selectedSucursal =
    sucursales.find((s) => s.id === selectedSucursalId) ?? null;

  return {
    sucursales,
    selectedSucursalId,
    selectedSucursal,
    selectSucursal,
    isLoading,
    canSelectSucursal: isAdmin,
  };
}
