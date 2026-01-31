// types for androsploit web dashboard

export type UserRole = 'PARENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface ChildDevice {
  id: string;
  parentId: string;
  deviceName: string;
  deviceModel: string;
  deviceId: string;
  osVersion: string;
  appVersion: string;
  isOnline: boolean;
  lastSeen: string;
  batteryLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface LocationRecord extends LocationData {
  id: string;
  childId: string;
  createdAt: string;
}

export interface AppUsage {
  id: string;
  childId: string;
  packageName: string;
  appName: string;
  usageTime: number;
  lastUsed: string;
  date: string;
}

export interface CallLog {
  id: string;
  childId: string;
  phoneNumber: string;
  contactName: string | null;
  callType: 'INCOMING' | 'OUTGOING' | 'MISSED';
  duration: number;
  timestamp: string;
}

export interface SmsLog {
  id: string;
  childId: string;
  phoneNumber: string;
  contactName: string | null;
  messageType: 'INCOMING' | 'OUTGOING';
  body: string;
  timestamp: string;
}

export interface Contact {
  id: string;
  childId: string;
  name: string;
  phoneNumbers: string[];
  emails: string[];
  syncedAt: string;
}

export interface Geofence {
  id: string;
  parentId: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  createdAt: string;
}

export interface Alert {
  id: string;
  userId: string;
  childId: string;
  type:
    | 'GEOFENCE_ENTRY'
    | 'GEOFENCE_EXIT'
    | 'LOW_BATTERY'
    | 'OFFLINE'
    | 'SCREEN_TIME'
    | 'APP_BLOCKED';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalChildren: number;
  onlineChildren: number;
  offlineChildren: number;
  totalLocations: number;
  totalAppUsage: number;
  totalAlerts: number;
  lastUpdated: string;
}

export interface ChildActivity {
  childId: string;
  childName: string;
  deviceName: string;
  isOnline: boolean;
  lastLocation: LocationData | null;
  batteryLevel: number;
  lastSeen: string;
  topApps: { appName: string; usageTime: number }[];
  recentCalls: CallLog[];
  screenTime: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
