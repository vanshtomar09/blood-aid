import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ALL_BLOOD_TYPES, type BloodInventory } from "@/lib/types";
import { Droplet } from "lucide-react";
import { useUser } from "@/context/user-context";
import Link from "next/link";

interface BloodAvailabilityGridProps {
  inventory: BloodInventory;
  variant?: 'compact' | 'default';
}

export default function BloodAvailabilityGrid({
  inventory,
  variant = 'default'
}: BloodAvailabilityGridProps) {
  const { userType } = useUser();
  const isGuest = userType === 'public';

  if (variant === 'compact') {
    return (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center">
            {ALL_BLOOD_TYPES.map((type) => (
                <Card key={type} className="p-2 flex flex-col items-center justify-center gap-1">
                    <p className="font-bold text-sm">{type}</p>
                    <p className="text-lg">{inventory[type]}</p>
                </Card>
            ))}
        </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {ALL_BLOOD_TYPES.map((type) => (
        <Card
          key={type}
          className="p-2 sm:p-3 flex flex-col items-center justify-center gap-1.5"
        >
          <p className="font-bold text-sm">{type}</p>
          <p className="text-lg font-medium">{inventory[type]}</p>
          <p className="text-xs text-muted-foreground">Units</p>
          {isGuest ? (
             <Button variant="secondary" size="sm" className="w-full mt-1 h-7 text-xs" asChild>
                <Link href="/login">Login to Request</Link>
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="w-full mt-1 h-7 text-xs">
                Request
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}
