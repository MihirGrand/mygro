"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect } from "react";
import {
  Device,
  devicesAtom,
  selectedDeviceIdAtom,
  selectedDeviceAtom,
} from "~/store/atom";
import {
  fetchChildren,
  fetchDeviceSummary,
  type ChildDevice,
} from "~/lib/api/client";
import { getUser } from "~/lib/auth";

const DEVICES_QUERY_KEY = ["devices"];
const REFRESH_INTERVAL = 30 * 1000;

// transform backend child device to frontend device format
function transformChildDevice(child: ChildDevice): Device {
  return {
    id: child.id,
    deviceId: child.deviceId,
    deviceName: child.deviceName,
    deviceModel: child.deviceModel || null,
    isOnline: child.isOnline,
    isActive: child.isActive,
    lastSeen: child.lastSeen || null,
    batteryLevel: null,
    latitude: child.lastLocation?.latitude || null,
    longitude: child.lastLocation?.longitude || null,
    lastLocationAt: child.lastLocation?.timestamp || null,
  };
}

// fetch devices from api
async function fetchDevices(): Promise<Device[]> {
  const user = getUser();
  if (!user?.id) {
    return [];
  }

  try {
    const children = await fetchChildren(user.id);
    return children.map(transformChildDevice);
  } catch (error) {
    console.error("Failed to fetch devices:", error);
    return [];
  }
}

export function useDevices() {
  const queryClient = useQueryClient();
  const [, setDevices] = useAtom(devicesAtom);
  const [selectedDeviceId, setSelectedDeviceId] = useAtom(selectedDeviceIdAtom);
  const [selectedDevice] = useAtom(selectedDeviceAtom);

  const {
    data: devices,
    isLoading,
    error,
    refetch,
  } = useQuery<Device[]>({
    queryKey: DEVICES_QUERY_KEY,
    queryFn: fetchDevices,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
  });

  // sync devices to atom when fetched
  useEffect(() => {
    if (devices) {
      setDevices(devices);

      // auto-select first device if none selected
      if (!selectedDeviceId && devices.length > 0) {
        setSelectedDeviceId(devices[0].id);
      }

      // if selected device no longer exists, select first available
      if (selectedDeviceId && !devices.find((d) => d.id === selectedDeviceId)) {
        setSelectedDeviceId(devices.length > 0 ? devices[0].id : null);
      }
    }
  }, [devices, setDevices, selectedDeviceId, setSelectedDeviceId]);

  const selectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
  };

  return {
    devices: devices || [],
    selectedDevice,
    selectedDeviceId,
    selectDevice,
    isLoading,
    error,
    refetch,
  };
}

// device stats for dashboard
export interface DeviceStats {
  totalCalls: number;
  unreadCalls: number;
  totalContacts: number;
  newContacts: number;
  totalPictures: number;
  recentPictures: number;
  lastLocation: {
    latitude: number;
    longitude: number;
    address: string | null;
    timestamp: string;
  } | null;
}

async function fetchDeviceStats(deviceId: string): Promise<DeviceStats> {
  try {
    const summary = await fetchDeviceSummary(deviceId);
    return {
      totalCalls: summary.counts.calls,
      unreadCalls: 0,
      totalContacts: summary.counts.contacts,
      newContacts: 0,
      totalPictures: 0,
      recentPictures: 0,
      lastLocation: summary.lastLocation
        ? {
            latitude: summary.lastLocation.latitude,
            longitude: summary.lastLocation.longitude,
            address: null,
            timestamp: summary.lastLocation.timestamp,
          }
        : null,
    };
  } catch (error) {
    console.error("Failed to fetch device stats:", error);
    return {
      totalCalls: 0,
      unreadCalls: 0,
      totalContacts: 0,
      newContacts: 0,
      totalPictures: 0,
      recentPictures: 0,
      lastLocation: null,
    };
  }
}

export function useDeviceStats(deviceId: string | null) {
  return useQuery<DeviceStats>({
    queryKey: ["deviceStats", deviceId],
    queryFn: () => fetchDeviceStats(deviceId!),
    enabled: !!deviceId,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
  });
}

// recent activity types
export interface Activity {
  id: string;
  type: "call" | "contact" | "picture" | "location" | "message" | "app";
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

async function fetchRecentActivity(deviceId: string): Promise<Activity[]> {
  try {
    const summary = await fetchDeviceSummary(deviceId);
    const activities: Activity[] = [];

    // transform recent calls to activities
    summary.recentActivity.calls.forEach((call, index) => {
      activities.push({
        id: `call-${call.id || index}`,
        type: "call",
        title: `${call.callType} Call`,
        description: `${call.contactName || call.phoneNumber} - ${formatDuration(call.duration)}`,
        timestamp: call.timestamp,
      });
    });

    // transform recent sms to activities
    summary.recentActivity.sms.forEach((sms, index) => {
      activities.push({
        id: `sms-${sms.id || index}`,
        type: "message",
        title: `${sms.messageType === "SENT" ? "Sent" : "Received"} Message`,
        description: `${sms.contactName || sms.phoneNumber}`,
        timestamp: sms.timestamp,
      });
    });

    // sort by timestamp descending
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return activities.slice(0, 10);
  } catch (error) {
    console.error("Failed to fetch recent activity:", error);
    return [];
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function useRecentActivity(deviceId: string | null) {
  return useQuery<Activity[]>({
    queryKey: ["recentActivity", deviceId],
    queryFn: () => fetchRecentActivity(deviceId!),
    enabled: !!deviceId,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
  });
}

export default useDevices;
