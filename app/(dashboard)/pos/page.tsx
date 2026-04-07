import { createClient } from "@/lib/supabase/server";
import { PosClient } from "@/components/pos/pos-client";
import {
  getProductosPOS,
  getCategoriasConProductos,
  getRepartidoresSucursal,
} from "@/lib/services/ventas";

export default async function PosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("sucursal_id, roles(nombre)")
    .eq("id", user!.id)
    .single();

  const sucursalId = profile?.sucursal_id ?? null;
  const rol =
    profile?.roles && !Array.isArray(profile.roles)
      ? (profile.roles as { nombre: string }).nombre
      : null;

  if (!sucursalId) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed p-12">
        <p className="text-muted-foreground">
          No tienes una sucursal asignada. Contacta al administrador.
        </p>
      </div>
    );
  }

  const [productos, categorias, repartidores] = await Promise.all([
    getProductosPOS(sucursalId),
    getCategoriasConProductos(sucursalId),
    getRepartidoresSucursal(sucursalId),
  ]);

  return (
    <PosClient
      productos={productos}
      categorias={categorias}
      repartidores={repartidores}
      sucursalId={sucursalId}
      rol={rol}
    />
  );
}
