import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ListaOrdenes } from "@/components/ordenes/lista-ordenes";
import { getOrdenes } from "@/lib/services/ordenes";
import { getConfiguracionNegocio } from "@/lib/services/configuracion";

export const dynamic = "force-dynamic";

export default async function OrdenesPage() {
  const supabase = await createClient();

  const [{ data: rolNombre }, { data: sucursalId }] = await Promise.all([
    supabase.rpc("get_user_role"),
    supabase.rpc("get_user_sucursal"),
  ]);

  const [ordenes, config] = await Promise.all([
    getOrdenes(sucursalId, "todas"),
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
      />
    </div>
  );
}
