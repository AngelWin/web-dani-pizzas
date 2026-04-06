import { PageHeader } from "@/components/shared/page-header";

export default function PromocionesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Promociones"
        description="Gestiona promociones y descuentos"
      />
      <div className="flex items-center justify-center rounded-xl border border-dashed p-12">
        <p className="text-muted-foreground">Próximamente</p>
      </div>
    </div>
  );
}
