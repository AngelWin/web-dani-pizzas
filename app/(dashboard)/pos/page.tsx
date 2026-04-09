import { createClient } from "@/lib/supabase/server";
import { PosClient } from "@/components/pos/pos-client";
import {
  getProductosPOS,
  getCategoriasConProductos,
  getRepartidoresSucursal,
} from "@/lib/services/ventas";
import { getConfiguracionNegocio } from "@/lib/services/configuracion";
import { getPromocionesActivas } from "@/lib/services/promociones";
import {
  getAllPizzaSabores,
  getAllProductoExtras,
} from "@/lib/services/productos";
import { getDeliveryServiciosPorSucursal } from "@/lib/services/delivery-servicios";
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

  const [{ data: rol }, { data: sucursalIdPerfil }] = await Promise.all([
    supabase.rpc("get_user_role"),
    supabase.rpc("get_user_sucursal"),
  ]);

  const esAdmin = rol === "administrador";

  let sucursales: Sucursal[] = [];
  if (esAdmin) {
    const { data } = await supabase
      .from("sucursales")
      .select("*")
      .eq("activa", true)
      .order("nombre");
    sucursales = data ?? [];
  }

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

  const [
    productos,
    categorias,
    repartidores,
    config,
    promociones,
    saboresPorCategoria,
    extrasPorCategoria,
    deliveryServicios,
  ] = await Promise.all([
    getProductosPOS(sucursalId),
    getCategoriasConProductos(sucursalId),
    getRepartidoresSucursal(sucursalId),
    getConfiguracionNegocio(),
    getPromocionesActivas(),
    getAllPizzaSabores(),
    getAllProductoExtras(),
    getDeliveryServiciosPorSucursal(sucursalId),
  ]);

  return (
    <PosClient
      key={sucursalId}
      productos={productos}
      categorias={categorias}
      repartidores={repartidores}
      sucursalId={sucursalId}
      sucursales={esAdmin ? sucursales : []}
      rol={rol}
      modeloNegocio={config.modelo_negocio}
      promociones={promociones}
      saboresPorCategoria={saboresPorCategoria}
      extrasPorCategoria={extrasPorCategoria}
      deliveryServicios={deliveryServicios}
    />
  );
}
