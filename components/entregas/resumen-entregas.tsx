import { Package, CheckCircle2, Banknote, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ResumenEntregas } from "@/lib/services/entregas";

type Props = {
  resumen: ResumenEntregas;
};

const CARDS = [
  {
    key: "total_entregas" as const,
    label: "Total entregas",
    icon: Package,
    format: (v: number) => String(v),
  },
  {
    key: "total_completadas" as const,
    label: "Completadas",
    icon: CheckCircle2,
    format: (v: number) => String(v),
  },
  {
    key: "total_a_pagar" as const,
    label: "Total a pagar",
    icon: Banknote,
    format: (v: number) => formatCurrency(v),
  },
  {
    key: "repartidores_activos" as const,
    label: "Repartidores activos",
    icon: Users,
    format: (v: number) => String(v),
  },
];

export function ResumenEntregasCards({ resumen }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, format }) => (
        <div
          key={key}
          className="rounded-xl border border-border bg-card p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">
                {format(resumen[key])}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
