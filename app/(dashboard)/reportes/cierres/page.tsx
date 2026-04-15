import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { TabsReporte } from "@/components/reportes/tabs-reporte";
import { TablaCierresCaja } from "@/components/reportes/tabla-cierres-caja";
import { FiltrosCierresCaja } from "@/components/reportes/filtros-cierres-caja";
import {
  getSesionesPorSucursal,
  getResumenSesion,
  type ResumenSesion,
} from "@/lib/services/caja-sesiones";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];
type FiltrosDiferencia = "todas" | "con_diferencia" | "sin_diferencia";

function getHoyLima(): string {
  const now = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return now.toISOString().split("T")[0];
}

function hace30DiasLima(): string {
  const now = new Date(Date.now() - 5 * 60 * 60 * 1000);
  now.setDate(now.getDate() - 29);
  return now.toISOString().split("T")[0];
}

export default async function CierresCajaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: rolNombre }, { data: sucursalIdPerfil }] = await Promise.all([
    supabase.rpc("get_user_role"),
    supabase.rpc("get_user_sucursal"),
  ]);

  if (!["administrador", "cajero"].includes(rolNombre ?? "")) {
    redirect("/dashboard");
  }

  const esAdmin = rolNombre === "administrador";

  let sucursales: Sucursal[] = [];
  if (esAdmin) {
    const { data } = await supabase
      .from("sucursales")
      .select("*")
      .eq("activa", true)
      .order("nombre");
    sucursales = data ?? [];
  }

  const hoy = getHoyLima();
  const hace30 = hace30DiasLima();

  const fechaDesde = params.desde ?? hace30;
  const fechaHasta = params.hasta ?? hoy;
  const sucursalParam = esAdmin ? (params.sucursal ?? null) : sucursalIdPerfil;
  const filtroDiff = (params.diferencia ?? "todas") as FiltrosDiferencia;

  const sesiones = await getSesionesPorSucursal(sucursalParam, {
    desde: `${fechaDesde}T00:00:00-05:00`,
    hasta: `${fechaHasta}T23:59:59.999-05:00`,
  });

  const sesionesFiltradas = sesiones.filter((s) => {
    if (filtroDiff === "con_diferencia")
      return s.diferencia !== null && s.diferencia !== 0;
    if (filtroDiff === "sin_diferencia")
      return s.diferencia !== null && s.diferencia === 0;
    return true;
  });

  // Fetch resumen de cada sesión en paralelo
  const resumenEntries = await Promise.all(
    sesionesFiltradas.map(async (s) => {
      try {
        const r = await getResumenSesion(s.id);
        return [s.id, r] as [string, ResumenSesion];
      } catch {
        return null;
      }
    }),
  );

  const resumenPorSesion: Record<string, ResumenSesion> = Object.fromEntries(
    resumenEntries.filter(Boolean) as [string, ResumenSesion][],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Historial de sesiones de caja"
      />

      <TabsReporte />

      <FiltrosCierresCaja
        sucursales={sucursales}
        esAdmin={esAdmin}
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        hoy={hoy}
        sucursalParam={sucursalParam}
        filtroDiff={filtroDiff}
        totalSesiones={sesionesFiltradas.length}
      />

      <TablaCierresCaja
        sesiones={sesionesFiltradas}
        resumenPorSesion={resumenPorSesion}
        mostrarSucursal={esAdmin && !sucursalParam}
      />
    </div>
  );
}
