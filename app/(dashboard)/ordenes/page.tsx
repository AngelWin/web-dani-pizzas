import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ListaOrdenes } from "@/components/ordenes/lista-ordenes";
import { getOrdenes } from "@/lib/services/ordenes";
import { getConfiguracionNegocio } from "@/lib/services/configuracion";
import { getNivelesMembresia } from "@/lib/services/membresias";
import { getSucursales } from "@/lib/services/sucursales";
import { FiltroSucursalOrdenes } from "@/components/ordenes/filtro-sucursal-ordenes";

export const dynamic = "force-dynamic";

function getHoyLima(): string {
  // Lima UTC-5
  const now = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return now.toISOString().split("T")[0];
}

function getMinFechaLima(): string {
  const hoy = new Date(Date.now() - 5 * 60 * 60 * 1000);
  hoy.setDate(hoy.getDate() - 7);
  return hoy.toISOString().split("T")[0];
}

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; sucursal?: string; mesa?: string }>;
}) {
  const params = await searchParams;
  const mesaId = params.mesa ?? undefined;
  const hoy = getHoyLima();

  const supabase = await createClient();

  const [{ data: rolNombre }, { data: sucursalIdPerfil }] = await Promise.all([
    supabase.rpc("get_user_role"),
    supabase.rpc("get_user_sucursal"),
  ]);

  const esAdmin = rolNombre === "administrador";
  const minFecha = esAdmin ? null : getMinFechaLima();

  // Admin puede filtrar por sucursal; no-admin usa su sucursal fija
  const sucursalId = esAdmin ? (params.sucursal ?? null) : sucursalIdPerfil;

  // Validar que la fecha esté dentro del rango permitido
  const fechaParam = params.fecha ?? hoy;
  const fechaFiltro =
    fechaParam <= hoy && (minFecha === null || fechaParam >= minFecha)
      ? fechaParam
      : hoy;

  const [ordenes, config, niveles, sucursales] = await Promise.all([
    getOrdenes(sucursalId, "todas", fechaFiltro, mesaId),
    getConfiguracionNegocio(),
    getNivelesMembresia(),
    esAdmin ? getSucursales() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Órdenes"
          description="Gestión y seguimiento de órdenes activas"
        />
        {esAdmin && (
          <FiltroSucursalOrdenes
            sucursales={sucursales}
            sucursalSeleccionadaId={sucursalId}
          />
        )}
      </div>
      <ListaOrdenes
        ordenes={ordenes}
        rol={rolNombre}
        modeloNegocio={config.modelo_negocio}
        fechaFiltro={fechaFiltro}
        hoy={hoy}
        minFecha={minFecha}
        niveles={niveles}
        mesaFiltro={mesaId}
      />
    </div>
  );
}
