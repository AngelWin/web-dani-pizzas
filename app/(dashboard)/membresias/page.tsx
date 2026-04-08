import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ListaMembresias } from "@/components/membresias/lista-membresias";
import {
  getNivelesMembresia,
  getReglasPuntos,
} from "@/lib/services/membresias";

export const dynamic = "force-dynamic";

export default async function MembresiasPage() {
  const supabase = await createClient();
  const { data: rolNombre } = await supabase.rpc("get_user_role");
  if (rolNombre !== "administrador") redirect("/dashboard");

  const [niveles, reglas] = await Promise.all([
    getNivelesMembresia(),
    getReglasPuntos(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membresías"
        description="Niveles de membresía y reglas del programa de puntos"
      />
      <ListaMembresias niveles={niveles} reglas={reglas} />
    </div>
  );
}
