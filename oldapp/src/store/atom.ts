import { atom } from "jotai";

const getInitialState = (): boolean => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("sidebarExpanded");
    return saved !== null ? JSON.parse(saved) : true;
  }
  return true;
};

const baseAtom = atom(getInitialState());

export const sidebarExpandedAtom = atom(
  (get) => get(baseAtom),
  (get, set, newValue: boolean) => {
    set(baseAtom, newValue);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarExpanded", JSON.stringify(newValue));
    }
  },
);

// device types
export interface Device {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceModel: string | null;
  isOnline: boolean;
  isActive: boolean;
  lastSeen: string | null;
  batteryLevel: number | null;
  latitude: number | null;
  longitude: number | null;
  lastLocationAt: string | null;
}

// selected device atom
const getSelectedDeviceId = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("selectedDeviceId");
  }
  return null;
};

const baseSelectedDeviceIdAtom = atom<string | null>(getSelectedDeviceId());

export const selectedDeviceIdAtom = atom(
  (get) => get(baseSelectedDeviceIdAtom),
  (get, set, newValue: string | null) => {
    set(baseSelectedDeviceIdAtom, newValue);
    if (typeof window !== "undefined") {
      if (newValue) {
        localStorage.setItem("selectedDeviceId", newValue);
      } else {
        localStorage.removeItem("selectedDeviceId");
      }
    }
  },
);

// devices list atom
export const devicesAtom = atom<Device[]>([]);

// selected device derived atom
export const selectedDeviceAtom = atom((get) => {
  const devices = get(devicesAtom);
  const selectedId = get(selectedDeviceIdAtom);
  if (!selectedId) return devices[0] || null;
  return devices.find((d) => d.id === selectedId) || devices[0] || null;
});
