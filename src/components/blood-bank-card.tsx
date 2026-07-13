import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BloodBank } from "@/lib/types";
import { MapPin, Hospital, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";


function getAvailabilityStatus(inventory: BloodBank['inventory']) {
    const totalUnits = Object.values(inventory).reduce((sum, count) => sum + count, 0);
    if (totalUnits === 0) return { text: "Unavailable", color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500"};
    if (totalUnits < 50) return { text: "Limited Stock", color: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" };
    return { text: "Available", color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" };
}


interface BloodBankCardProps {
  bank: BloodBank;
}

export default function BloodBankCard({ bank }: BloodBankCardProps) {
  const status = getAvailabilityStatus(bank.inventory);

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
            <div>
                <CardTitle className="font-headline text-xl">{bank.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4" /> {bank.location}
                </CardDescription>
            </div>
            <Badge variant="outline" className={cn("whitespace-nowrap", status.color)}>
               <span className={cn("h-2 w-2 rounded-full mr-2", status.dot)}></span>
               {status.text}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Distance:</span>
            <span className="font-medium">{bank.distance}</span>
        </div>
         <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Units:</span>
            <span className="font-medium">{Object.values(bank.inventory).reduce((s, a) => s + a, 0)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end items-center bg-muted/50 p-4">
        <Button asChild>
            <Link href={`/bank/${bank.id}`}>
                View Details <ArrowRight className="ml-2 h-4 w-4"/>
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

    