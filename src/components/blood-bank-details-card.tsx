'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BloodBank } from "@/lib/types";
import { MapPin, Hospital, Phone, Mail, Clock } from "lucide-react";
import BloodAvailabilityGrid from "./blood-availability-grid";
import dynamic from "next/dynamic";
import { Skeleton } from "./ui/skeleton";

const DetailsCardMap = dynamic(() => import('@/components/details-card-map'), {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
});


interface BloodBankDetailsCardProps {
  bank: BloodBank;
}


export default function BloodBankDetailsCard({ bank }: BloodBankDetailsCardProps) {
    
  return (
    <Card>
      <CardHeader className="bg-muted/30 p-6">
        <div className="flex items-start justify-between gap-4">
            <div>
                <CardTitle className="font-headline text-2xl">{bank.name}</CardTitle>
                <p className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {bank.location}
                </p>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
                <Hospital className="h-8 w-8 text-secondary-foreground" />
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold mb-2 font-headline">Contact Information</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary"/> <span>+91 98765 43210 (Example)</span></p>
                    <p className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary"/> <span>contact@${bank.name.toLowerCase().replace(/ /g, '')}.org (Example)</span></p>
                    <p className="flex items-center gap-3"><Clock className="h-4 w-4 text-primary"/> <span>Open 24 Hours</span></p>
                </div>
            </div>
            <div>
                <h3 className="font-semibold mb-3 font-headline">Live Inventory</h3>
                <BloodAvailabilityGrid inventory={bank.inventory} variant="compact" />
            </div>
        </div>
        <div className="h-80 md:h-full w-full rounded-lg overflow-hidden border">
           <DetailsCardMap bank={bank} />
        </div>
      </CardContent>
    </Card>
  );
}
