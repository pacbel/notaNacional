import { ReactNode } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { twMerge } from "tailwind-merge";

export function StatsCard({
  title,
  value,
  description,
  icon,
  className,
  valueClassName,
  descriptionClassName,
}: {
  title: string;
  value: ReactNode;
  description?: string;
  icon?: ReactNode;
  className?: string;
  valueClassName?: string;
  descriptionClassName?: string;
}) {
  return (
    <Card className={twMerge("flex flex-col justify-between gap-4", className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              {title}
            </CardTitle>
            <div
              className={twMerge(
                "mt-2 text-3xl font-semibold text-[hsl(var(--foreground))]",
                valueClassName
              )}
            >
              {value}
            </div>
          </div>
          {icon && <div className="text-[hsl(var(--muted-foreground))]">{icon}</div>}
        </div>
        {description && (
          <CardDescription
            className={twMerge("text-xs text-[hsl(var(--muted-foreground))]", descriptionClassName)}
          >
            {description}
          </CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}
