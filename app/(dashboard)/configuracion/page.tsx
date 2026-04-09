import { PageHeader } from "@/components/shared/page-header";
import { ModeloNegocioForm } from "@/components/configuracion/modelo-negocio-form";
import { DeliveryServiciosForm } from "@/components/configuracion/delivery-servicios-form";
import { getConfiguracionNegocio } from "@/lib/services/configuracion";
import { getAllDeliveryServiciosConSucursal } from "@/lib/services/delivery-servicios";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [config, serviciosPorSucursal] = await Promise.all([
    getConfiguracionNegocio(),
    getAllDeliveryServiciosConSucursal(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configuración"
        description="Ajustes generales del negocio y servicios de delivery"
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

      {/* Servicios de delivery */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Servicios de delivery
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona los servicios de delivery por sucursal. El precio base se
            auto-llena en el POS al seleccionar el servicio.
          </p>
        </div>
        <DeliveryServiciosForm serviciosPorSucursal={serviciosPorSucursal} />
      </section>
    </div>
  );
}
