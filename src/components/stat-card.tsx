import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AdminStat } from "@/lib/types";

interface StatCardProps {
  stat: AdminStat;
  className?: string;
}

export default function StatCard({ stat, className }: StatCardProps) {
  const { title, value, change, changeType, icon: Icon } = stat;
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p
            className={cn(
              "text-xs text-muted-foreground",
              changeType === "increase" ? "text-green-600" : "text-destructive"
            )}
          >
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
