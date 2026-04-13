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
    .select("id, nombre, categoria_id")
    .eq("disponible", true)
    .order("nombre");
  return (data ?? []) as {
    id: string;
    nombre: string;
    categoria_id: string | null;
  }[];
}

async function getMedidasBasico() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categoria_medidas")
    .select("id, nombre, categoria_id")
    .order("orden");
  return (data ?? []) as {
    id: string;
    nombre: string;
    categoria_id: string;
  }[];
}

async function getNivelesMembresia() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("membresias_niveles")
    .select("id, nombre, descuento_porcentaje")
    .order("orden");
  return (data ?? []) as {
    id: string;
    nombre: string;
    descuento_porcentaje: number | null;
  }[];
}

async function getSucursalesBasico() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sucursales")
    .select("id, nombre")
    .eq("activa", true)
    .order("nombre");
  return (data ?? []) as { id: string; nombre: string }[];
}

export default async function PromocionesPage() {
  const supabase = await createClient();
  const { data: rolData } = await supabase.rpc("get_user_role");
  if (rolData !== "administrador") redirect("/dashboard");

  const [promociones, productos, sucursales, medidas, niveles] =
    await Promise.all([
      getPromociones(),
      getProductosBasico(),
      getSucursalesBasico(),
      getMedidasBasico(),
      getNivelesMembresia(),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promociones"
        description="Gestiona promociones y descuentos para el POS"
      />
      <ListaPromociones
        promociones={promociones}
        productos={productos}
        sucursales={sucursales}
        medidas={medidas}
        niveles={niveles}
      />
    </div>
  );
}
