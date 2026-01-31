"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  MapPin,
  Clock,
  Play,
  Square,
  ChevronRight,
  Navigation,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useTheme } from "next-themes";
import { useDevices } from "~/hooks/useDevices";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoicGV5dTVoIiwiYSI6ImNtNmRmdmh3MDB0eXUybnM3cTNwbHExNnoifQ._Mh0IPdLV4Jyhh2m_QXgEQ";

interface LocationRecord {
  id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  accuracy: number | null;
  timestamp: string;
}

// mock location history
const mockLocationHistory: LocationRecord[] = [
  {
    id: "1",
    latitude: 19.076,
    longitude: 72.8777,
    address: "Bandra West, Mumbai",
    accuracy: 15,
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    latitude: 19.0821,
    longitude: 72.8416,
    address: "Andheri East, Mumbai",
    accuracy: 20,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    latitude: 19.1136,
    longitude: 72.8697,
    address: "Powai, Mumbai",
    accuracy: 12,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "4",
    latitude: 19.0596,
    longitude: 72.8295,
    address: "Juhu Beach, Mumbai",
    accuracy: 18,
    timestamp: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "5",
    latitude: 19.0178,
    longitude: 72.8478,
    address: "Dadar West, Mumbai",
    accuracy: 10,
    timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "6",
    latitude: 18.9388,
    longitude: 72.8354,
    address: "Colaba, Mumbai",
    accuracy: 8,
    timestamp: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: "7",
    latitude: 19.0176,
    longitude: 72.8562,
    address: "Parel, Mumbai",
    accuracy: 14,
    timestamp: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: "8",
    latitude: 19.0989,
    longitude: 72.8515,
    address: "Kurla West, Mumbai",
    accuracy: 22,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
];

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LocationCard({
  location,
  isSelected,
  onClick,
}: {
  location: LocationRecord;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "hover:bg-muted/50 cursor-pointer border-b border-l-4 p-4 transition-colors",
        isSelected ? "border-l-primary bg-primary/5" : "border-l-transparent",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "rounded-lg p-2",
            isSelected ? "bg-primary/10" : "bg-muted",
          )}
        >
          <MapPin
            className={cn(
              "h-4 w-4",
              isSelected ? "text-primary" : "text-muted-foreground",
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {location.address || "Unknown location"}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
          <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(location.timestamp)}
            </span>
            {location.accuracy && <span>±{location.accuracy}m</span>}
          </div>
        </div>
        <ChevronRight
          className={cn(
            "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
            isSelected && "text-primary rotate-90",
          )}
        />
      </div>
    </div>
  );
}

export default function LocationPage() {
  const { resolvedTheme } = useTheme();
  const mapRef = useRef<MapRef>(null);
  const { selectedDevice, isLoading: isLoadingDevices } = useDevices();

  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [locations] = useState<LocationRecord[]>(mockLocationHistory);

  const selectedLocation = useMemo(() => {
    if (!selectedLocationId) return null;
    return locations.find((l) => l.id === selectedLocationId) || null;
  }, [selectedLocationId, locations]);

  const handleLocationClick = useCallback((location: LocationRecord) => {
    setSelectedLocationId(location.id);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15,
        duration: 1500,
        essential: true,
      });
    }
  }, []);

  const handleToggleLiveTracking = () => {
    setIsLiveTracking(!isLiveTracking);
  };

  const mapStyle =
    resolvedTheme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/light-v11";

  const defaultCenter = useMemo(() => {
    if (locations.length > 0) {
      return {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
      };
    }
    return { latitude: 19.076, longitude: 72.8777 };
  }, [locations]);

  const markers = useMemo(
    () =>
      locations.map((location, index) => {
        const isSelected = location.id === selectedLocationId;
        const isLatest = index === 0;

        return (
          <Marker
            key={location.id}
            longitude={location.longitude}
            latitude={location.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleLocationClick(location);
            }}
          >
            <div
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-full border-2 shadow-lg transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground h-10 w-10"
                  : isLatest
                    ? "h-8 w-8 border-green-500 bg-green-500 text-white hover:scale-110"
                    : "border-muted-foreground bg-muted-foreground h-6 w-6 text-white hover:scale-110",
              )}
            >
              <MapPin
                className={cn(
                  isSelected ? "h-5 w-5" : isLatest ? "h-4 w-4" : "h-3 w-3",
                )}
              />
            </div>
          </Marker>
        );
      }),
    [locations, selectedLocationId, handleLocationClick],
  );

  if (isLoadingDevices) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!selectedDevice) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-muted-foreground text-center">
          <p className="text-lg font-medium">No device selected</p>
          <p className="mt-1 text-sm">Select a device to view location data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* header */}
      <div className="shrink-0 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Location</h1>
            <p className="text-muted-foreground text-sm">
              Track {selectedDevice.deviceName} location
            </p>
          </div>
          <Button
            variant={isLiveTracking ? "destructive" : "default"}
            onClick={handleToggleLiveTracking}
            className="gap-2"
          >
            {isLiveTracking ? (
              <>
                <Square className="h-4 w-4" />
                Stop Tracking
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Live Tracking
              </>
            )}
          </Button>
        </div>
      </div>

      {/* content */}
      <div className="flex flex-1 overflow-hidden">
        {/* map */}
        <div className="relative flex-1">
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: defaultCenter.longitude,
              latitude: defaultCenter.latitude,
              zoom: 12,
            }}
            mapStyle={mapStyle}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: "100%", height: "100%" }}
          >
            {markers}
          </Map>

          {/* map legend */}
          <div className="bg-background/95 absolute bottom-4 left-4 rounded-lg border p-3 shadow-lg backdrop-blur">
            <p className="mb-2 text-xs font-medium">Location Status</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-muted-foreground">Latest</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="bg-muted-foreground h-3 w-3 rounded-full"></div>
                <span className="text-muted-foreground">History</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="bg-primary h-3 w-3 rounded-full"></div>
                <span className="text-muted-foreground">Selected</span>
              </div>
            </div>
          </div>

          {/* live tracking indicator */}
          {isLiveTracking && (
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-green-500 shadow-lg">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Live Tracking Active</span>
            </div>
          )}
        </div>

        {/* location history sidebar */}
        <div className="bg-background hidden w-80 shrink-0 flex-col border-l lg:flex xl:w-96">
          <div className="shrink-0 border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Location History</h2>
              <span className="text-muted-foreground text-sm">
                {locations.length} records
              </span>
            </div>
          </div>
          <ScrollArea className="flex-1">
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                isSelected={location.id === selectedLocationId}
                onClick={() => handleLocationClick(location)}
              />
            ))}
          </ScrollArea>

          {/* selected location details */}
          {selectedLocation && (
            <div className="shrink-0 border-t p-4">
              <h3 className="mb-2 text-sm font-medium">Selected Location</h3>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {selectedLocation.address || "Unknown"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {selectedLocation.latitude.toFixed(6)},{" "}
                  {selectedLocation.longitude.toFixed(6)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatDateTime(selectedLocation.timestamp)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full gap-2"
                  onClick={() => {
                    window.open(
                      `https://www.google.com/maps?q=${selectedLocation.latitude},${selectedLocation.longitude}`,
                      "_blank",
                    );
                  }}
                >
                  <Navigation className="h-4 w-4" />
                  Open in Google Maps
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
