'use client';

import { useUserLocation } from '@/context/location-context';
import { useEffect, useState } from 'react';
import { getBloodBanks } from '@/lib/blood-banks';
import { BloodBank } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import BloodBankCard from '@/components/blood-bank-card';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

// Dynamically import the map component to ensure it's client-side only
const BloodBankMap = dynamic(() => import('@/components/blood-bank-map'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center"><p>Loading Map...</p></div>
});


export default function MapPage() {
  const { userLocation } = useUserLocation();
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  useEffect(() => {
    async function loadBloodBanks() {
      setIsLoading(true);
      const banks = await getBloodBanks();
      setBloodBanks(banks);
      setIsLoading(false);
    }
    loadBloodBanks();
  }, []);

  return (
    <div className="flex flex-col gap-8 h-full">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Blood Bank Map
        </h1>
        <p className="text-muted-foreground">
          Find and explore blood banks near you.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>All Blood Banks</CardTitle>
              <CardDescription>
                Select a bank to view details on the map.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow p-0 overflow-hidden">
              <ScrollArea className="h-[600px] lg:h-[calc(100vh-22rem)]">
                <div className="p-4 space-y-4">
                  {isLoading ? (
                    <>
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </>
                  ) : (
                    bloodBanks.map((bank) => (
                      <div
                        key={bank.id}
                        onClick={() => setSelectedBankId(bank.id)}
                        className={`cursor-pointer rounded-lg transition-all ${
                          selectedBankId === bank.id
                            ? 'ring-2 ring-primary shadow-lg'
                            : ''
                        }`}
                      >
                        <BloodBankCard bank={bank} />
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 h-[600px] lg:h-auto w-full rounded-lg overflow-hidden">
          <BloodBankMap
            userLocation={userLocation}
            bloodBanks={bloodBanks}
            selectedBankId={selectedBankId}
            onMarkerClick={setSelectedBankId}
          />
        </div>
      </div>
    </div>
  );
}
