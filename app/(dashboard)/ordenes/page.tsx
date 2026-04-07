import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ListaOrdenes } from "@/components/ordenes/lista-ordenes";
import { getOrdenes } from "@/lib/services/ordenes";
import { ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function OrdenesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const roleName = (user?.app_metadata?.role as string | undefined) ?? null;
  const isAdmin = roleName === ROLES.ADMINISTRADOR;

  // Obtener sucursal del perfil (para no-admins)
  let sucursalId: string | null = null;

  if (!isAdmin && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("sucursal_id")
      .eq("id", user.id)
      .single<{ sucursal_id: string | null }>();
    sucursalId = profile?.sucursal_id ?? null;
  }

  const ordenes = await getOrdenes(sucursalId, "todas");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes"
        description="Gestión y seguimiento de órdenes activas"
      />
      <ListaOrdenes ordenes={ordenes} />
    </div>
  );
}
