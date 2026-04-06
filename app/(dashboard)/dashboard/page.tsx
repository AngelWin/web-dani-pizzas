import { PageHeader } from "@/components/shared/page-header";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen de ventas y métricas del día"
      />
      <div className="flex items-center justify-center rounded-xl border border-dashed p-12">
        <p className="text-muted-foreground">Próximamente</p>
      </div>
    </div>
  );
}
