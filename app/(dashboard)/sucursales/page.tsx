import { PageHeader } from "@/components/shared/page-header";

export default function SucursalesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sucursales"
        description="Gestiona las sucursales de DANI PIZZAS"
      />
      <div className="flex items-center justify-center rounded-xl border border-dashed p-12">
        <p className="text-muted-foreground">Próximamente</p>
      </div>
    </div>
  );
}
