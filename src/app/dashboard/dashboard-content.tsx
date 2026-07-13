"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { urgentRequests } from "@/lib/data";
import BloodBankCard from "@/components/blood-bank-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookUser, Droplet, HandHeart, Hospital, MapPin, Search, Siren } from "lucide-react";
import { useSearch } from "@/context/search-context";
import { useMemo, useState, useEffect } from "react";
import { ALL_BLOOD_TYPES, BloodBank } from "@/lib/types";
import { getBloodBanks } from "@/lib/blood-banks";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserLocation } from "@/context/location-context";
import QuickActionCard from "@/components/quick-action-card";
import { useSearchParams, useRouter } from "next/navigation";

export default function DashboardContent() {
  const { committedSearchQuery } = useSearch();
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userLocation, locationError } = useUserLocation();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect to search page if search query is present
    const query = searchParams.get('q');
    if (query) {
      router.replace(`/search?q=${query}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    async function loadBloodBanks() {
      setIsLoading(true);
      const banks = await getBloodBanks();
      setBloodBanks(banks);
      setIsLoading(false);
    }
    loadBloodBanks();
  }, []);

  const quickActions = [
    {
      title: "Find Blood",
      description: "Search for available blood types",
      icon: Search,
      href: "#nearby-banks",
      color: "bg-blue-500",
    },
    {
      title: "Donate Blood",
      description: "Become a lifesaver today",
      icon: HandHeart,
      href: "/register",
      color: "bg-red-500",
    },
    {
      title: "Request Blood",
      description: "Submit an urgent blood request",
      icon: BookUser,
      href: "/requests/new",
      color: "bg-green-500",
    },
    {
        title: "Blood Banks",
        description: "View all nearby facilities",
        icon: Hospital,
        href: "/map",
        color: "bg-purple-500",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Welcome back!
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {userLocation 
              ? "Showing results for your area" 
              : locationError 
                ? `Location disabled: ${locationError}` 
                : "Detecting location..."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map(action => <QuickActionCard key={action.title} {...action} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div id="nearby-banks" className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold font-headline tracking-tight">
            Nearby Blood Banks
            </h2>
            {isLoading ? (
            <div className="grid gap-6 md:grid-cols-1">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="flex flex-col">
                        <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                        <CardContent className="flex-grow space-y-2">
                            <Skeleton className="h-24 w-full" />
                        </CardContent>
                        <CardFooter className="p-4">
                            <Skeleton className="h-10 w-full" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
            ) : bloodBanks.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-1">
                {bloodBanks.map((bank) => (
                <BloodBankCard key={bank.id} bank={bank} />
                ))}
            </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground rounded-lg bg-muted">
                    <p className="text-lg font-medium">No Blood Banks Found.</p>
                    <p>Check back later for updates.</p>
                </div>
            )}
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Urgent Requests</CardTitle>
                    <CardDescription>
                    Critical needs from nearby centers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {urgentRequests.slice(0, 2).map((request) => (
                    <div
                        key={request.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
                    >
                        <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Siren className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold">
                            {request.bloodType} at {request.location}
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
                        className="hidden sm:inline-flex"
                        >
                        {request.status}
                        </Badge>
                    </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Upcoming Camps</CardTitle>
                     <CardDescription>
                        Join a donation drive near you.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Droplet className="h-5 w-5 text-primary" />
                        </div>
                         <div>
                            <p className="font-semibold">City Center Drive</p>
                            <p className="text-sm text-muted-foreground">Nov 15, 2024</p>
                        </div>
                        <Button size="sm" variant="outline" className="ml-auto">Details</Button>
                    </div>
                     <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Droplet className="h-5 w-5 text-primary" />
                        </div>
                         <div>
                            <p className="font-semibold">Red Cross Camp</p>
                            <p className="text-sm text-muted-foreground">Dec 01, 2024</p>
                        </div>
                        <Button size="sm" variant="outline" className="ml-auto">Details</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
