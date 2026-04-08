import { PageHeader } from "@/components/shared/page-header";
import { ListaPromociones } from "@/components/promociones/lista-promociones";
import { getPromociones } from "@/lib/services/promociones";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getProductosBasico() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("productos")
    .select("id, nombre")
    .eq("disponible", true)
    .order("nombre");
  return (data ?? []) as { id: string; nombre: string }[];
}

export default async function PromocionesPage() {
  const supabase = await createClient();
  const { data: rolData } = await supabase.rpc("get_user_role");
  if (rolData !== "administrador") redirect("/dashboard");

  const [promociones, productos] = await Promise.all([
    getPromociones(),
    getProductosBasico(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promociones"
        description="Gestiona promociones y descuentos para el POS"
      />
      <ListaPromociones promociones={promociones} productos={productos} />
    </div>
  );
}
