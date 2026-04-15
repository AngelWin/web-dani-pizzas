"use client";

import { useState } from "react";
import { useCurrency } from "@/hooks/use-currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CerrarCajaDialog } from "./cerrar-caja-dialog";
import type { ResumenSesion } from "@/lib/services/caja-sesiones";
import {
  Clock,
  Banknote,
  CreditCard,
  TrendingUp,
  Receipt,
  XCircle,
} from "lucide-react";

type Props = {
  resumen: ResumenSesion;
  onCerrar: () => void;
};

const METODO_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  tarjeta: "Tarjeta",
  mixto: "Mixto",
  transferencia: "Transferencia",
  sin_metodo: "Sin método",
};

function formatDuracion(desde: string): string {
  const diff = Date.now() - new Date(desde).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export function SesionActiva({ resumen, onCerrar }: Props) {
  const [cerrarOpen, setCerrarOpen] = useState(false);
  const { formatCurrency } = useCurrency();

  const { sesion } = resumen;
  const abiertaPor = sesion.abierta_por_profile;
  const nombreAbierto = abiertaPor
    ? `${abiertaPor.nombre} ${abiertaPor.apellido_paterno}`
    : "—";

  return (
    <div className="space-y-4">
      {/* Estado de sesión */}
      <div className="rounded-xl border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500 text-white">Caja abierta</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuracion(sesion.abierta_at)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Abierta por <span className="font-medium">{nombreAbierto}</span> ·{" "}
              {new Date(sesion.abierta_at).toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {sesion.notas_apertura && (
              <p className="text-xs text-muted-foreground italic mt-1">
                "{sesion.notas_apertura}"
              </p>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="h-10 gap-1.5"
            onClick={() => setCerrarOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Cerrar caja
          </Button>
        </div>
      </div>

      {/* Resumen del turno */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label="Total ventas"
          value={formatCurrency(resumen.total_ventas)}
          highlight
        />
        <StatCard
          icon={<Banknote className="h-4 w-4 text-green-600" />}
          label="Efectivo"
          value={formatCurrency(resumen.total_efectivo)}
        />
        <StatCard
          icon={<CreditCard className="h-4 w-4 text-blue-600" />}
          label="No efectivo"
          value={formatCurrency(resumen.total_no_efectivo)}
        />
        <StatCard
          icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
          label="Ventas"
          value={String(resumen.cantidad_ventas)}
        />
      </div>

      {/* Desglose por método */}
      {Object.keys(resumen.por_metodo).length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-sm font-medium">Desglose por método de pago</p>
          <Separator />
          <div className="space-y-1.5">
            {Object.entries(resumen.por_metodo).map(([metodo, monto]) => (
              <div key={metodo} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {METODO_LABELS[metodo] ?? metodo}
                </span>
                <span className="font-medium">{formatCurrency(monto)}</span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex justify-between text-sm font-semibold">
            <span>Efectivo esperado en caja</span>
            <span className="text-primary">
              {formatCurrency(resumen.monto_esperado_efectivo)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            = Monto inicial ({formatCurrency(sesion.monto_inicial)}) + Ventas en
            efectivo ({formatCurrency(resumen.total_efectivo)})
          </p>
        </div>
      )}

      <CerrarCajaDialog
        open={cerrarOpen}
        onOpenChange={setCerrarOpen}
        sesionId={sesion.id}
        montoEsperado={resumen.monto_esperado_efectivo}
        onSuccess={() => {
          setCerrarOpen(false);
          onCerrar();
        }}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 space-y-1 ${highlight ? "border-primary/30 bg-primary/5" : "bg-card"}`}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-lg font-bold leading-tight">{value}</p>
    </div>
  );
}
