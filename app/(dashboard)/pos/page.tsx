import { PageHeader } from "@/components/shared/page-header";

export default function PosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Punto de Venta"
        description="Registra pedidos y ventas"
      />
      <div className="flex items-center justify-center rounded-xl border border-dashed p-12">
        <p className="text-muted-foreground">Próximamente</p>
      </div>
    </div>
  );
}
