import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconClassName?: string;
  trend?: "up" | "down" | "neutral";
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  trend,
}: StatsCardProps) {
  return (
    <Card className="shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p
                className={cn(
                  "text-xs",
                  trend === "up" && "text-green-600 dark:text-green-400",
                  trend === "down" && "text-red-600 dark:text-red-400",
                  (!trend || trend === "neutral") && "text-muted-foreground",
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              iconClassName ?? "bg-primary/10 text-primary",
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
