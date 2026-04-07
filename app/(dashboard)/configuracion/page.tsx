import { PageHeader } from "@/components/shared/page-header";
import { ModeloNegocioForm } from "@/components/configuracion/modelo-negocio-form";
import { TarifasDeliveryForm } from "@/components/configuracion/tarifas-delivery-form";
import {
  getConfiguracionNegocio,
  getDeliveryFeesPorSucursal,
} from "@/lib/services/configuracion";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [config, tarifas] = await Promise.all([
    getConfiguracionNegocio(),
    getDeliveryFeesPorSucursal(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configuración"
        description="Ajustes generales del negocio y tarifas de delivery"
      />

      {/* Modelo de operación */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Modelo de operación
          </h2>
          <p className="text-sm text-muted-foreground">
            Define cómo fluyen los estados de una orden en la interfaz. No
            afecta los datos almacenados.
          </p>
        </div>
        <ModeloNegocioForm modeloActual={config.modelo_negocio} />
      </section>

      <Separator />

      {/* Tarifas de delivery */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Tarifas de delivery
          </h2>
          <p className="text-sm text-muted-foreground">
            Costo predeterminado de delivery por sucursal. El cajero puede
            editarlo en cada pedido.
          </p>
        </div>
        <TarifasDeliveryForm tarifas={tarifas} />
      </section>
    </div>
  );
}
