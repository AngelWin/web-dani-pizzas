import { PageHeader } from "@/components/shared/page-header";
import { SucursalesCliente } from "@/components/sucursales/sucursales-cliente";
import { getSucursales } from "@/lib/services/sucursales";

export const dynamic = "force-dynamic";

export default async function SucursalesPage() {
  const sucursales = await getSucursales();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sucursales"
        description="Gestiona los datos de las sucursales de DANI PIZZAS"
      />
      <SucursalesCliente sucursales={sucursales} />
    </div>
  );
}
