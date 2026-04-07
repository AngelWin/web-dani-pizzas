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

  // Usar RPCs que usan auth.uid() directamente (más confiable que join manual)
  const [{ data: rol }, { data: sucursalIdPerfil }] = await Promise.all([
    supabase.rpc("get_user_role"),
    supabase.rpc("get_user_sucursal"),
  ]);

  const esAdmin = rol === "administrador";

  // Obtener sucursales si es admin
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
  // 1. Query param ?sucursal=<id> (admin cambia desde UI)
  // 2. Sucursal del perfil (cajero/mesero/repartidor)
  // 3. Primera sucursal disponible (admin sin sucursal fija)
  const sucursalParam =
    typeof params.sucursal === "string" ? params.sucursal : null;

  let sucursalId: string | null = sucursalParam ?? sucursalIdPerfil ?? null;

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
