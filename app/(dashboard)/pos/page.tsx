import { createClient } from "@/lib/supabase/server";
import { PosClient } from "@/components/pos/pos-client";
import {
  getProductosPOS,
  getCategoriasConProductos,
  getRepartidoresSucursal,
} from "@/lib/services/ventas";
import type { Database } from "@/types/database";

type Sucursal = Database["public"]["Tables"]["sucursales"]["Row"];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("sucursal_id, roles(nombre)")
    .eq("id", user!.id)
    .single();

  const rol =
    profile?.roles && !Array.isArray(profile.roles)
      ? (profile.roles as { nombre: string }).nombre
      : null;

  const esAdmin = rol === "administrador";

  // Obtener sucursales disponibles
  let sucursales: Sucursal[] = [];
  if (esAdmin) {
    const { data } = await supabase
      .from("sucursales")
      .select("*")
      .eq("activa", true)
      .order("nombre");
    sucursales = data ?? [];
  }

  // Determinar sucursal activa:
  // 1. Query param (admin cambia desde UI)
  // 2. Sucursal del perfil (cajero/mesero/repartidor)
  // 3. Primera sucursal disponible (admin sin sucursal asignada)
  const sucursalParam =
    typeof params.sucursal === "string" ? params.sucursal : null;

  let sucursalId: string | null = sucursalParam ?? profile?.sucursal_id ?? null;

  if (!sucursalId && esAdmin && sucursales.length > 0) {
    sucursalId = sucursales[0].id;
  }

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
      sucursales={esAdmin ? sucursales : []}
      rol={rol}
    />
  );
}
