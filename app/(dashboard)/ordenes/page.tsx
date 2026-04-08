import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ListaOrdenes } from "@/components/ordenes/lista-ordenes";
import { getOrdenes } from "@/lib/services/ordenes";
import { getConfiguracionNegocio } from "@/lib/services/configuracion";

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
  searchParams: Promise<{ fecha?: string }>;
}) {
  const params = await searchParams;
  const hoy = getHoyLima();
  const minFecha = getMinFechaLima();

  // Validar que la fecha esté dentro del rango permitido (máx 7 días atrás)
  const fechaParam = params.fecha ?? hoy;
  const fechaFiltro =
    fechaParam >= minFecha && fechaParam <= hoy ? fechaParam : hoy;

  const supabase = await createClient();

  const [{ data: rolNombre }, { data: sucursalId }] = await Promise.all([
    supabase.rpc("get_user_role"),
    supabase.rpc("get_user_sucursal"),
  ]);

  const [ordenes, config] = await Promise.all([
    getOrdenes(sucursalId, "todas", fechaFiltro),
    getConfiguracionNegocio(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes"
        description="Gestión y seguimiento de órdenes activas"
      />
      <ListaOrdenes
        ordenes={ordenes}
        rol={rolNombre}
        modeloNegocio={config.modelo_negocio}
        fechaFiltro={fechaFiltro}
        hoy={hoy}
        minFecha={minFecha}
      />
    </div>
  );
}
