import { Skeleton } from "@/components/ui/skeleton";

export default function OrdenesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-48 rounded-xl" />
      </div>

      {/* Fecha + tabs */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
