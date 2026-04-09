import { Skeleton } from "@/components/ui/skeleton";

export default function PosLoading() {
  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-8rem)] gap-0">
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>

      {/* Panel principal */}
      <div className="flex flex-1 overflow-hidden rounded-xl border shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        {/* Catálogo */}
        <div className="flex-1 p-3 md:p-4 space-y-4">
          {/* Barra búsqueda + categorías */}
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
            ))}
          </div>
          {/* Grid de productos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Carrito desktop */}
        <div className="hidden md:block w-72 xl:w-80 shrink-0 border-l p-4 space-y-3">
          <Skeleton className="h-6 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
          <div className="mt-auto pt-4">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
