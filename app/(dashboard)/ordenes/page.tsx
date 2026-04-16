import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ListaOrdenes } from "@/components/ordenes/lista-ordenes";
import { getOrdenes } from "@/lib/services/ordenes";
import { getConfiguracionNegocio } from "@/lib/services/configuracion";
import { getNivelesMembresia } from "@/lib/services/membresias";
import { getSucursales } from "@/lib/services/sucursales";
import { getSesionActivaPorSucursal } from "@/lib/services/caja-sesiones";
import { FiltroSucursalOrdenes } from "@/components/ordenes/filtro-sucursal-ordenes";
import { getHoyLima, getDiasAtrasLima } from "@/lib/utils/fecha";

export const dynamic = "force-dynamic";

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
  const minFecha = esAdmin ? null : getDiasAtrasLima(7);

  // Admin puede filtrar por sucursal; no-admin usa su sucursal fija
  const sucursalId = esAdmin ? (params.sucursal ?? null) : sucursalIdPerfil;

  // Validar que la fecha esté dentro del rango permitido
  const fechaParam = params.fecha ?? hoy;
  const fechaFiltro =
    fechaParam <= hoy && (minFecha === null || fechaParam >= minFecha)
      ? fechaParam
      : hoy;

  const [ordenes, config, niveles, sucursales, sesionActiva] =
    await Promise.all([
      // Sin filtro de fecha cuando se filtra por mesa, para mostrar órdenes de cualquier día
      getOrdenes(sucursalId, "todas", mesaId ? undefined : fechaFiltro, mesaId),
      getConfiguracionNegocio(),
      getNivelesMembresia(),
      esAdmin ? getSucursales() : Promise.resolve([]),
      // Siempre usar la sucursal propia del usuario (no el filtro de sucursal)
      // para verificar si hay caja abierta al cobrar
      sucursalIdPerfil
        ? getSesionActivaPorSucursal(sucursalIdPerfil).catch(() => null)
        : Promise.resolve(null),
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
        modeloNegocio={config?.modelo_negocio ?? "simple"}
        fechaFiltro={fechaFiltro}
        hoy={hoy}
        minFecha={minFecha}
        niveles={niveles}
        mesaFiltro={mesaId}
        haySesionActiva={sesionActiva !== null}
      />
    </div>
  );
}
