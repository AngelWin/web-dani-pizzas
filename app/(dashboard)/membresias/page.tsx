import { PageHeader } from "@/components/shared/page-header";

export default function MembresiasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Membresías"
        description="Programa de puntos y niveles de membresía"
      />
      <div className="flex items-center justify-center rounded-xl border border-dashed p-12">
        <p className="text-muted-foreground">Próximamente</p>
      </div>
    </div>
  );
}
