import { Skeleton } from "@/components/ui/skeleton";

export default function UsuariosLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Botón crear */}
      <Skeleton className="h-10 w-36 rounded-xl" />

      {/* Tabla */}
      <div className="space-y-2">
        <Skeleton className="h-10 rounded-xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
