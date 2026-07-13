'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getBloodBanks } from '@/lib/blood-banks';
import { urgentRequests } from '@/lib/data';
import { BloodBank, UrgentRequest, ALL_BLOOD_TYPES } from '@/lib/types';
import BloodBankCard from '@/components/blood-bank-card';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Siren } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const banks = await getBloodBanks();
      setBloodBanks(banks);
      setIsLoading(false);
    }
    loadData();
  }, [query]);

  const { filteredBloodBanks, filteredUrgentRequests } = useMemo(() => {
    if (!query) {
      return { filteredBloodBanks: [], filteredUrgentRequests: [] };
    }

    const lowerCaseQuery = query.toLowerCase().trim();

    // Filter Blood Banks
    const filteredBanks = bloodBanks.filter((bank: BloodBank) => {
      const isNameMatch = bank.name.toLowerCase().includes(lowerCaseQuery);
      const isLocationMatch = bank.location.toLowerCase().includes(lowerCaseQuery);
      
      const matchingBloodTypes = ALL_BLOOD_TYPES.filter(type => 
        type.toLowerCase().startsWith(lowerCaseQuery)
      );
      const isBloodTypeMatch = matchingBloodTypes.some(type => bank.inventory[type] > 0);

      return isNameMatch || isLocationMatch || isBloodTypeMatch;
    });

    // Filter Urgent Requests
    const filteredRequests = urgentRequests.filter((request: UrgentRequest) => {
        const isBloodTypeMatch = request.bloodType.toLowerCase().includes(lowerCaseQuery);
        const isLocationMatch = request.location.toLowerCase().includes(lowerCaseQuery);
        return isBloodTypeMatch || isLocationMatch;
    });

    return { filteredBloodBanks: filteredBanks, filteredUrgentRequests: filteredRequests };
  }, [query, bloodBanks]);

  if (isLoading) {
    return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
             <div>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid gap-4">
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        </div>
    );
  }

  const hasResults = filteredBloodBanks.length > 0 || filteredUrgentRequests.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Search Results
        </h1>
        <p className="text-muted-foreground">
          Showing results for "{query}"
        </p>
      </div>
      
      {!hasResults ? (
         <Card className="flex flex-col items-center justify-center py-16 text-center">
            <CardContent className="flex flex-col items-center gap-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">No results found</h2>
                <p className="text-muted-foreground">
                    No results were found for ‘{query}’.<br/> Try another blood group, bank name or city.
                </p>
            </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
            {filteredBloodBanks.length > 0 && (
                 <section>
                    <h2 className="text-2xl font-bold font-headline tracking-tight mb-4">
                        Blood Banks ({filteredBloodBanks.length})
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredBloodBanks.map((bank) => (
                            <BloodBankCard key={bank.id} bank={bank} />
                        ))}
                    </div>
                </section>
            )}

            {filteredUrgentRequests.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold font-headline tracking-tight mb-4">
                        Urgent Requests ({filteredUrgentRequests.length})
                    </h2>
                     <div className="space-y-4">
                        {filteredUrgentRequests.map((request) => (
                            <Card key={request.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-3 rounded-full">
                                            <Siren className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">
                                            {request.bloodType} needed at {request.location}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                            {request.time}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                    variant={
                                        request.status === "Pending" ? "destructive" : "secondary"
                                    }
                                    >
                                    {request.status}
                                    </Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchResults />
        </Suspense>
    )
}
