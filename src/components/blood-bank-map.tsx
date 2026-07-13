"use client";

import React, { useEffect, useRef } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BloodBank } from "@/lib/types";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { renderToStaticMarkup } from 'react-dom/server';

const defaultCenter: L.LatLngExpression = [28.6139, 77.2090]; // Default to Delhi

// Custom icon setup - Red for Blood Banks
const hospitalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Blue for User Location
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Set default icon for all markers
L.Marker.prototype.options.icon = hospitalIcon;

interface BloodBankMapProps {
    userLocation: { lat: number, lng: number } | null;
    bloodBanks: BloodBank[];
    selectedBankId: string | null;
    onMarkerClick: (bankId: string) => void;
}

function BloodBankMap({ userLocation, bloodBanks, selectedBankId, onMarkerClick }: BloodBankMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Record<string, L.Marker>>({});
    const userMarkerRef = useRef<L.Marker | null>(null);

    // Initialize map
    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            const map = L.map(mapRef.current).setView(userLocation || defaultCenter, 11);

            L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }
            ).addTo(map);

            mapInstanceRef.current = map;
        }
        
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []); // Empty dependency array ensures this runs only once

    // Update user marker
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (userLocation) {
            if (userMarkerRef.current) {
                userMarkerRef.current.setLatLng(userLocation);
            } else {
                userMarkerRef.current = L.marker(userLocation, { icon: userIcon }).addTo(map).bindPopup("Your Location");
            }
            if (!selectedBankId) {
                map.setView(userLocation, 11);
            }
        }
    }, [userLocation, selectedBankId]);

    // Update blood bank markers
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear existing bank markers
        Object.values(markersRef.current).forEach(marker => marker.remove());
        markersRef.current = {};
        
        bloodBanks.forEach(bank => {
            const popupContent = renderToStaticMarkup(
                <div className="p-1 max-w-xs">
                    <h3 className="font-bold text-base mb-1 font-headline">{bank.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{bank.location}</p>
                    <Button size="sm" asChild>
                        <Link href={`/bank/${bank.id}`}>View Details <ArrowRight className="h-4 w-4 ml-2" /></Link>
                    </Button>
                </div>
            );

            const marker = L.marker(bank.coordinates, { icon: hospitalIcon }).addTo(map).bindPopup(popupContent);
            marker.on('click', () => onMarkerClick(bank.id));
            markersRef.current[bank.id] = marker;
        });

    }, [bloodBanks, onMarkerClick]);

    // Pan to selected bank
    useEffect(() => {
        const map = mapInstanceRef.current;
        const selectedBank = bloodBanks.find(b => b.id === selectedBankId);

        if (map && selectedBank) {
            map.setView(selectedBank.coordinates, 14, { animate: true, pan: { duration: 1 } });
            const marker = markersRef.current[selectedBankId!];
            if (marker && !marker.isPopupOpen()) {
                marker.openPopup();
            }
        }
    }, [selectedBankId, bloodBanks]);

    return <div ref={mapRef} style={{ height: "100%", width: "100%" }} />;
}

export default React.memo(BloodBankMap);
