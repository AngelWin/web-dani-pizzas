import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ResumenVentas } from "@/components/dashboard/resumen-ventas";
import nextDynamic from "next/dynamic";

const GraficoVentasTipo = nextDynamic(
  () =>
    import("@/components/dashboard/grafico-ventas-tipo").then(
      (mod) => mod.GraficoVentasTipo,
    ),
  {
    loading: () => <Skeleton className="h-72 rounded-xl" />,
  },
);
import { PedidosRecientes } from "@/components/dashboard/pedidos-recientes";
import { FiltroSucursalDashboard } from "@/components/dashboard/filtro-sucursal-dashboard";
import {
  getStatsYDesglose,
  getPedidosRecientes,
} from "@/lib/services/dashboard";
import { getOrdenesProgramadasProximas } from "@/lib/services/ordenes";
import { PedidosProgramados } from "@/components/dashboard/pedidos-programados";
import { ROLES } from "@/lib/constants";
import type { Database } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";

type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];

type DashboardPageProps = {
  searchParams: Promise<{ sucursal?: string }>;
};

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { sucursal: sucursalParam } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const roleName = (user?.app_metadata?.role as string | undefined) ?? null;
  const isAdmin = roleName === ROLES.ADMINISTRADOR;

  // Determinar sucursal a filtrar
  let sucursalId: string | null = null;
  let sucursales: Sucursal[] = [];

  if (isAdmin) {
    // Admin: cargar todas las sucursales y respetar el filtro de URL
    const { data } = await supabase
      .from("sucursales")
      .select("*")
      .eq("activa", true)
      .order("nombre");
    sucursales = data ?? [];
    sucursalId = sucursalParam ?? null;
  } else {
    // No-admin: usar la sucursal del perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("sucursal_id")
      .eq("id", user?.id ?? "")
      .single<{ sucursal_id: string | null }>();
    sucursalId = profile?.sucursal_id ?? null;
  }

  // Fetch paralelo de todos los datos (stats + desglose en una sola query)
  const [{ stats, desglose }, pedidos, pedidosProgramados] = await Promise.all([
    getStatsYDesglose(sucursalId, isAdmin),
    getPedidosRecientes(sucursalId, 8, isAdmin),
    getOrdenesProgramadasProximas(sucursalId, 5).catch(() => []),
  ]);

  const sucursalActiva = isAdmin
    ? (sucursales.find((s) => s.id === sucursalId) ?? null)
    : null;

  const descripcion = isAdmin
    ? sucursalActiva
      ? `Sucursal: ${sucursalActiva.nombre}`
      : "Todas las sucursales"
    : "Resumen de ventas y métricas del día";

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={descripcion}>
        {isAdmin && (
          <Suspense
            fallback={<Skeleton className="h-10 w-[200px] rounded-xl" />}
          >
            <FiltroSucursalDashboard
              sucursales={sucursales}
              sucursalSeleccionadaId={sucursalId}
            />
          </Suspense>
        )}
      </PageHeader>

      <Suspense fallback={<StatsSkeleton />}>
        <ResumenVentas stats={stats} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <GraficoVentasTipo data={desglose} />
        <PedidosRecientes pedidos={pedidos} />
      </div>

      {pedidosProgramados.length > 0 && (
        <PedidosProgramados
          pedidos={pedidosProgramados}
          mostrarSucursal={isAdmin && !sucursalId}
        />
      )}
    </div>
  );
}
