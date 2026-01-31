import ky from "ky";
import { getToken } from "../auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// api client with auth header
export const api = ky.create({
  prefixUrl: API_BASE_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
  },
});

// response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// contact types
export interface Contact {
  id: string;
  childId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  syncedAt: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
  limit: number;
  offset: number;
}

// sms types
export interface SmsLog {
  id: string;
  childId: string;
  phoneNumber: string;
  contactName?: string;
  messageType: "SENT" | "RECEIVED";
  body?: string;
  timestamp: string;
  createdAt: string;
}

export interface SmsResponse {
  smsLogs: SmsLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface SmsConversation {
  phoneNumber: string;
  contactName?: string;
  messageCount: number;
  lastMessageAt: string;
}

// call log types
export interface CallLog {
  id: string;
  childId: string;
  phoneNumber: string;
  contactName?: string;
  callType: "INCOMING" | "OUTGOING" | "MISSED" | "REJECTED" | "BLOCKED";
  duration: number;
  timestamp: string;
  createdAt: string;
}

export interface CallLogsResponse {
  callLogs: CallLog[];
  total: number;
  limit: number;
  offset: number;
}

// installed app types
export interface InstalledApp {
  id: string;
  childId: string;
  packageName: string;
  appName: string;
  versionName?: string;
  isSystemApp: boolean;
  syncedAt: string;
}

export interface AppsResponse {
  apps: InstalledApp[];
  total: number;
}

// location types
export interface Location {
  id: string;
  childId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  address?: string;
  timestamp: string;
}

// action result types
export type ActionType =
  | "TAKE_PHOTO"
  | "TAKE_SCREENSHOT"
  | "GET_LOCATION"
  | "SYNC_CONTACTS"
  | "SYNC_SMS"
  | "SYNC_CALL_LOGS"
  | "SYNC_APPS"
  | "SYNC_ALL"
  | "LOCK_DEVICE"
  | "RING_DEVICE"
  | "RECORD_AUDIO"
  | "GET_CLIPBOARD";

export type ActionStatus =
  | "PENDING"
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface ActionResult {
  id: string;
  childId: string;
  actionId: string;
  actionType: ActionType;
  status: ActionStatus;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  imageUrl?: string;
  audioUrl?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  createdAt: string;
  completedAt?: string;
}

export interface ActionResultsResponse {
  results: ActionResult[];
  total: number;
  limit: number;
  offset: number;
}

export interface Photo {
  id: string;
  actionId: string;
  actionType: "TAKE_PHOTO" | "TAKE_SCREENSHOT";
  imageUrl: string;
  createdAt: string;
  completedAt?: string;
}

export interface PhotosResponse {
  photos: Photo[];
  total: number;
  limit: number;
  offset: number;
}

export interface Recording {
  id: string;
  actionId: string;
  actionType: "RECORD_AUDIO";
  audioUrl: string;
  createdAt: string;
  completedAt?: string;
}

export interface RecordingsResponse {
  recordings: Recording[];
  total: number;
  limit: number;
  offset: number;
}

// device summary types
export interface DeviceSummary {
  device: {
    id: string;
    name: string;
    model?: string;
    isOnline: boolean;
    lastSeen?: string;
  };
  counts: {
    contacts: number;
    sms: number;
    calls: number;
    apps: number;
    locations: number;
    appUsage: number;
  };
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  recentActivity: {
    calls: CallLog[];
    sms: SmsLog[];
  };
}

export interface ChildDevice {
  id: string;
  deviceName: string;
  deviceModel?: string;
  deviceId: string;
  isOnline: boolean;
  isActive: boolean;
  lastSeen?: string;
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  dataCounts: {
    contacts: number;
    sms: number;
    calls: number;
  };
}

// contacts api
export async function fetchContacts(
  childId: string,
  params?: { search?: string; limit?: number; offset?: number },
): Promise<ContactsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const response = await api
    .get(`api/data/contacts/${childId}?${searchParams}`)
    .json<ApiResponse<ContactsResponse>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to fetch contacts");
  }

  return response.data;
}

// sms api
export async function fetchSmsLogs(
  childId: string,
  params?: { phoneNumber?: string; limit?: number; offset?: number },
): Promise<SmsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.phoneNumber) searchParams.set("phoneNumber", params.phoneNumber);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const response = await api
    .get(`api/data/sms/${childId}?${searchParams}`)
    .json<ApiResponse<SmsResponse>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to fetch SMS logs");
  }

  return response.data;
}

export async function fetchSmsConversations(
  childId: string,
): Promise<SmsConversation[]> {
  const response = await api
    .get(`api/data/sms/${childId}/conversations`)
    .json<ApiResponse<SmsConversation[]>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to fetch conversations");
  }

  return response.data;
}

// call logs api
export async function fetchCallLogs(
  childId: string,
  params?: {
    phoneNumber?: string;
    callType?: string;
    limit?: number;
    offset?: number;
  },
): Promise<CallLogsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.phoneNumber) searchParams.set("phoneNumber", params.phoneNumber);
  if (params?.callType) searchParams.set("callType", params.callType);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const response = await api
    .get(`api/data/call-logs/${childId}?${searchParams}`)
    .json<ApiResponse<CallLogsResponse>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to fetch call logs");
  }

  return response.data;
}

// apps api
export async function fetchInstalledApps(
  childId: string,
  params?: { search?: string; includeSystem?: boolean },
): Promise<AppsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.includeSystem)
    searchParams.set("includeSystem", params.includeSystem.toString());

  const response = await api
    .get(`api/data/apps/${childId}?${searchParams}`)
    .json<ApiResponse<AppsResponse>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to fetch apps");
  }

  return response.data;
}

// locations api
export async function fetchLocations(
  childId: string,
  params?: { limit?: number; offset?: number },
): Promise<Location[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const response = await api
    .get(`api/monitoring/locations/${childId}?${searchParams}`)
    .json<ApiResponse<Location[]>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to fetch locations");
  }

  return response.data;
}

// device summary api
export async function fetchDeviceSummary(
  childId: string,
): Promise<DeviceSummary> {
  const response = await api
    .get(`api/data/summary/${childId}`)
    .json<ApiResponse<DeviceSummary>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to fetch device summary");
  }

  return response.data;
}

// children api
export async function fetchChildren(parentId: string): Promise<ChildDevice[]> {
  const response = await api
    .get(`api/data/children/status/${parentId}`)
    .json<ApiResponse<ChildDevice[]>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to fetch children");
  }

  return response.data;
}

// auth types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "PARENT" | "ADMIN";
  createdAt: string;
  token: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

// auth api
export async function signIn(data: SignInRequest): Promise<AuthUser> {
  const response = await api
    .post("api/auth/parent/signin", { json: data })
    .json<ApiResponse<AuthUser>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to sign in");
  }

  return response.data;
}

export async function signUp(data: SignUpRequest): Promise<AuthUser> {
  const response = await api
    .post("api/auth/parent/signup", { json: data })
    .json<ApiResponse<AuthUser>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to create account");
  }

  return response.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await api.get("api/auth/me").json<ApiResponse<AuthUser>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to get current user");
  }

  return response.data;
}

// remote actions api
export interface RemoteActionRequest {
  childId: string;
  action: ActionType;
  params?: Record<string, unknown>;
}

export interface RemoteActionResponse {
  childId: string;
  action: ActionType;
  actionId?: string;
  params: Record<string, unknown>;
  status: "COMPLETED" | "QUEUED";
  result?: Record<string, unknown>;
  completedAt?: string;
  queuedAt?: string;
  message?: string;
}

export async function triggerRemoteAction(
  request: RemoteActionRequest,
): Promise<RemoteActionResponse> {
  const response = await api
    .post("api/data/remote-action", { json: request })
    .json<ApiResponse<RemoteActionResponse>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to trigger remote action");
  }

  return response.data;
}

// action results api
export async function fetchActionResults(
  childId: string,
  params?: { actionType?: ActionType; limit?: number; offset?: number },
): Promise<ActionResultsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.actionType) searchParams.set("actionType", params.actionType);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const response = await api
    .get(`api/data/action-results/${childId}?${searchParams}`)
    .json<ApiResponse<ActionResultsResponse>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to fetch action results");
  }

  return response.data;
}

export async function fetchActionResult(
  actionId: string,
): Promise<ActionResult> {
  const response = await api
    .get(`api/data/action-results/detail/${actionId}`)
    .json<ApiResponse<ActionResult>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to fetch action result");
  }

  return response.data;
}

// photos api
export async function fetchPhotos(
  childId: string,
  params?: { limit?: number; offset?: number },
): Promise<PhotosResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const response = await api
    .get(`api/data/photos/${childId}?${searchParams}`)
    .json<ApiResponse<PhotosResponse>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to fetch photos");
  }

  return response.data;
}

// recordings api
export async function fetchRecordings(
  childId: string,
  params?: { limit?: number; offset?: number },
): Promise<RecordingsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const response = await api
    .get(`api/data/recordings/${childId}?${searchParams}`)
    .json<ApiResponse<RecordingsResponse>>();

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to fetch recordings");
  }

  return response.data;
}

// sync triggers
export async function triggerSync(
  childId: string,
  syncType: "contacts" | "sms" | "calls" | "apps" | "all",
): Promise<RemoteActionResponse> {
  const actionMap: Record<string, ActionType> = {
    contacts: "SYNC_CONTACTS",
    sms: "SYNC_SMS",
    calls: "SYNC_CALL_LOGS",
    apps: "SYNC_APPS",
    all: "SYNC_ALL",
  };

  return triggerRemoteAction({
    childId,
    action: actionMap[syncType],
  });
}

export default api;
