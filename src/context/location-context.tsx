"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type LocationType = {
  lat: number;
  lng: number;
} | null;

interface LocationContextType {
  userLocation: LocationType;
  setUserLocation: (location: LocationType) => void;
  locationError: string | null;
  setLocationError: (error: string | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocation] = useState<LocationType>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

    useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Error getting user location:", error);
          let message = "An unknown error occurred.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location access denied.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              message = "Location request timed out.";
              break;
          }
          setLocationError(message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  return (
    <LocationContext.Provider value={{ userLocation, setUserLocation, locationError, setLocationError }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useUserLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useUserLocation must be used within a LocationProvider');
  }
  return context;
}