import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getSesionActivaPorSucursal,
  getResumenSesion,
} from "@/lib/services/caja-sesiones";
import { CajaClient } from "./caja-client";

export default async function CajaPage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: rolNombre },
    { data: sucursalId },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("get_user_role"),
    supabase.rpc("get_user_sucursal"),
  ]);

  if (!user) redirect("/login");
  if (!["administrador", "cajero"].includes(rolNombre ?? "")) {
    redirect("/pos");
  }

  // Admin sin sucursal asignada → usa la primera sucursal disponible
  let sucursalIdEfectiva = sucursalId;
  let sucursales: { id: string; nombre: string }[] = [];

  if (rolNombre === "administrador") {
    const { data } = await supabase
      .from("sucursales")
      .select("id, nombre")
      .eq("activa", true)
      .order("nombre");
    sucursales = data ?? [];
    if (!sucursalIdEfectiva && sucursales.length > 0) {
      sucursalIdEfectiva = sucursales[0].id;
    }
  }

  if (!sucursalIdEfectiva) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Sin sucursal asignada.</p>
      </div>
    );
  }

  // Obtener sesión activa y su resumen
  const sesionActiva = await getSesionActivaPorSucursal(
    sucursalIdEfectiva,
  ).catch(() => null);

  const resumen = sesionActiva
    ? await getResumenSesion(sesionActiva.id).catch(() => null)
    : null;

  return (
    <CajaClient
      rol={rolNombre ?? "cajero"}
      sucursalId={sucursalIdEfectiva}
      sucursales={sucursales}
      sesionActiva={sesionActiva}
      resumenInicial={resumen}
    />
  );
}
