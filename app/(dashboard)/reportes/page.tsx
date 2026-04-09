import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { FiltrosReporte } from "@/components/reportes/filtros-reporte";
import { ResumenCards } from "@/components/reportes/resumen-cards";
import nextDynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const GraficoVentasDia = nextDynamic(
  () =>
    import("@/components/reportes/grafico-ventas-dia").then(
      (mod) => mod.GraficoVentasDia,
    ),
  {
    loading: () => <Skeleton className="h-64 rounded-xl" />,
  },
);

const GraficoVentasTipoReporte = nextDynamic(
  () =>
    import("@/components/reportes/grafico-ventas-tipo").then(
      (mod) => mod.GraficoVentasTipoReporte,
    ),
  {
    loading: () => <Skeleton className="h-64 rounded-xl" />,
  },
);
import { TablaTopProductos } from "@/components/reportes/tabla-top-productos";
import { TablaDetalleDelivery } from "@/components/reportes/tabla-detalle-delivery";
import { TablaSucursales } from "@/components/reportes/tabla-sucursales";
import { TablaVentasDetalle } from "@/components/reportes/tabla-ventas-detalle";
import { getReporteCompleto } from "@/lib/services/reportes";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];

function getHoyLima(): string {
  const now = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return now.toISOString().split("T")[0];
}

function hace7DiasLima(): string {
  const now = new Date(Date.now() - 5 * 60 * 60 * 1000);
  now.setDate(now.getDate() - 6);
  return now.toISOString().split("T")[0];
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const hoy = getHoyLima();
  const hace7 = hace7DiasLima();

  const [{ data: rolNombre }, { data: sucursalIdPerfil }] = await Promise.all([
    supabase.rpc("get_user_role"),
    supabase.rpc("get_user_sucursal"),
  ]);

  const esAdmin = rolNombre === "administrador";

  // Sucursales disponibles (solo para admin)
  let sucursales: Sucursal[] = [];
  if (esAdmin) {
    const { data } = await supabase
      .from("sucursales")
      .select("*")
      .eq("activa", true)
      .order("nombre");
    sucursales = data ?? [];
  }

  // Resolver filtros desde searchParams
  const fechaDesde = params.desde ?? hace7;
  const fechaHasta = params.hasta ?? hoy;

  // Sucursal: admin puede filtrar, cajero usa la suya
  const sucursalParam = esAdmin ? (params.sucursal ?? null) : sucursalIdPerfil;

  // Tipo de pedido
  const tipoPedido =
    params.tipo && params.tipo !== "todos" ? params.tipo : null;

  const filtros = {
    fechaDesde,
    fechaHasta,
    sucursalId: sucursalParam,
    tipoPedido,
    esAdmin,
  };

  // Una sola query a ventas + 1 a venta_items (antes eran 6+1)
  const {
    resumen,
    ventasPorDia,
    ventasPorTipo,
    ventasPorSucursal,
    detalleDelivery,
    topProductos,
    ventasDetalle,
  } = await getReporteCompleto(filtros, esAdmin, 10, 50);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Análisis de ventas y rendimiento del negocio"
      />

      {/* Filtros */}
      <FiltrosReporte
        sucursales={sucursales}
        esAdmin={esAdmin}
        sucursalIdFijo={sucursalIdPerfil}
      />

      {/* Resumen de métricas */}
      <ResumenCards resumen={resumen} />

      {/* Gráficos principales */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GraficoVentasDia data={ventasPorDia} />
        <GraficoVentasTipoReporte data={ventasPorTipo} />
      </div>

      {/* Segunda fila: top productos + delivery */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TablaTopProductos data={topProductos} />
        <TablaDetalleDelivery data={detalleDelivery} />
      </div>

      {/* Rendimiento por sucursal (solo admin) */}
      {esAdmin && ventasPorSucursal.length > 0 && (
        <TablaSucursales data={ventasPorSucursal} />
      )}

      {/* Detalle de ventas */}
      <TablaVentasDetalle
        data={ventasDetalle}
        mostrarSucursal={esAdmin && !sucursalParam}
      />
    </div>
  );
}
