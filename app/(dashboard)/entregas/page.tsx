import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { FiltrosEntregas } from "@/components/entregas/filtros-entregas";
import { ResumenEntregasCards } from "@/components/entregas/resumen-entregas";
import { TablaEntregas } from "@/components/entregas/tabla-entregas";
import { getEntregasPorRepartidor } from "@/lib/services/entregas";
import { getSucursalesActivas } from "@/lib/services/usuarios";
import { getHoyLima } from "@/lib/utils/fecha";

export const dynamic = "force-dynamic";

export default async function EntregasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Obtener rol y sucursal del usuario actual
  const [{ data: rolNombre }, { data: sucursalId }, { data: userData }] =
    await Promise.all([
      supabase.rpc("get_user_role"),
      supabase.rpc("get_user_sucursal"),
      supabase.auth.getUser(),
    ]);

  const esAdmin = rolNombre === "administrador";
  const esCajero = rolNombre === "cajero";
  const esRepartidor = rolNombre === "repartidor";
  const userId = userData.user?.id ?? null;

  const hoy = getHoyLima();

  // Resolver filtros
  const fechaDesde = params.desde ?? hoy;
  const fechaHasta = params.hasta ?? hoy;
  const sucursalParam = esAdmin
    ? (params.sucursal ?? null)
    : (sucursalId ?? null);

  // Obtener datos
  const [{ resumen, repartidores }, sucursales] = await Promise.all([
    getEntregasPorRepartidor(
      {
        fechaDesde,
        fechaHasta,
        sucursalId: sucursalParam,
      },
      // Si es repartidor, solo ver sus propias entregas
      esRepartidor ? userId : null,
      esAdmin,
    ),
    getSucursalesActivas(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entregas"
        description="Contabilidad de entregas por repartidor para liquidación diaria"
      />

      <FiltrosEntregas
        sucursales={sucursales}
        esAdmin={esAdmin}
        sucursalIdFijo={!esAdmin ? sucursalId : undefined}
      />

      <ResumenEntregasCards resumen={resumen} />

      <TablaEntregas repartidores={repartidores} />
    </div>
  );
}
