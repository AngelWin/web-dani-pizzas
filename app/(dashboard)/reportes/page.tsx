import { PageHeader } from "@/components/shared/page-header";

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Análisis de ventas y rendimiento"
      />
      <div className="flex items-center justify-center rounded-xl border border-dashed p-12">
        <p className="text-muted-foreground">Próximamente</p>
      </div>
    </div>
  );
}
