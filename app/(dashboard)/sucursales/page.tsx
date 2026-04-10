import { PageHeader } from "@/components/shared/page-header";
import { SucursalesCliente } from "@/components/sucursales/sucursales-cliente";
import { getSucursales } from "@/lib/services/sucursales";
import { getTodasLasMesas } from "@/lib/services/mesas";
import type { Mesa } from "@/lib/services/mesas";

export const dynamic = "force-dynamic";

export default async function SucursalesPage() {
  const sucursales = await getSucursales();

  // Cargar mesas de todas las sucursales en paralelo
  const mesasArrays = await Promise.all(
    sucursales.map((s) => getTodasLasMesas(s.id)),
  );

  const mesasPorSucursal: Record<string, Mesa[]> = {};
  sucursales.forEach((s, i) => {
    mesasPorSucursal[s.id] = mesasArrays[i];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sucursales"
        description="Gestiona los datos de las sucursales de DANI PIZZAS"
      />
      <SucursalesCliente
        sucursales={sucursales}
        mesasPorSucursal={mesasPorSucursal}
      />
    </div>
  );
}
