"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchContacts,
  fetchSmsLogs,
  fetchSmsConversations,
  fetchCallLogs,
  fetchInstalledApps,
  fetchLocations,
  fetchDeviceSummary,
  fetchChildren,
  fetchActionResults,
  fetchActionResult,
  fetchPhotos,
  fetchRecordings,
  triggerRemoteAction,
  triggerSync,
  type ContactsResponse,
  type SmsResponse,
  type SmsConversation,
  type CallLogsResponse,
  type AppsResponse,
  type Location,
  type DeviceSummary,
  type ChildDevice,
  type ActionResultsResponse,
  type ActionResult,
  type ActionType,
  type RemoteActionRequest,
  type PhotosResponse,
  type RecordingsResponse,
} from "~/lib/api/client";

// refresh interval 30s
const REFRESH_INTERVAL = 30 * 1000;

// fast refresh for action results 5s
const FAST_REFRESH_INTERVAL = 5 * 1000;

// contacts hook
export function useContacts(
  childId: string | null,
  params?: { search?: string; limit?: number; offset?: number },
) {
  return useQuery<ContactsResponse>({
    queryKey: ["contacts", childId, params],
    queryFn: () => fetchContacts(childId!, params),
    enabled: !!childId,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
  });
}

// sms logs hook
export function useSmsLogs(
  childId: string | null,
  params?: { phoneNumber?: string; limit?: number; offset?: number },
) {
  return useQuery<SmsResponse>({
    queryKey: ["sms", childId, params],
    queryFn: () => fetchSmsLogs(childId!, params),
    enabled: !!childId,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
  });
}

// sms conversations hook
export function useSmsConversations(childId: string | null) {
  return useQuery<SmsConversation[]>({
    queryKey: ["sms-conversations", childId],
    queryFn: () => fetchSmsConversations(childId!),
    enabled: !!childId,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
  });
}

// call logs hook
export function useCallLogs(
  childId: string | null,
  params?: {
    phoneNumber?: string;
    callType?: string;
    limit?: number;
    offset?: number;
  },
) {
  return useQuery<CallLogsResponse>({
    queryKey: ["call-logs", childId, params],
    queryFn: () => fetchCallLogs(childId!, params),
    enabled: !!childId,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
  });
}

// installed apps hook
export function useInstalledApps(
  childId: string | null,
  params?: { search?: string; includeSystem?: boolean },
) {
  return useQuery<AppsResponse>({
    queryKey: ["apps", childId, params],
    queryFn: () => fetchInstalledApps(childId!, params),
    enabled: !!childId,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
  });
}

// locations hook
export function useLocations(
  childId: string | null,
  params?: { limit?: number; offset?: number },
) {
  return useQuery<Location[]>({
    queryKey: ["locations", childId, params],
    queryFn: () => fetchLocations(childId!, params),
    enabled: !!childId,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
  });
}

// device summary hook
export function useDeviceSummary(childId: string | null) {
  return useQuery<DeviceSummary>({
    queryKey: ["device-summary", childId],
    queryFn: () => fetchDeviceSummary(childId!),
    enabled: !!childId,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
  });
}

// children hook
export function useChildren(parentId: string | null) {
  return useQuery<ChildDevice[]>({
    queryKey: ["children", parentId],
    queryFn: () => fetchChildren(parentId!),
    enabled: !!parentId,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
  });
}

// action results hook with fast refresh
export function useActionResults(
  childId: string | null,
  params?: { actionType?: ActionType; limit?: number; offset?: number },
) {
  return useQuery<ActionResultsResponse>({
    queryKey: ["action-results", childId, params],
    queryFn: () => fetchActionResults(childId!, params),
    enabled: !!childId,
    staleTime: FAST_REFRESH_INTERVAL,
    refetchInterval: FAST_REFRESH_INTERVAL,
  });
}

// single action result hook
export function useActionResult(actionId: string | null) {
  return useQuery<ActionResult>({
    queryKey: ["action-result", actionId],
    queryFn: () => fetchActionResult(actionId!),
    enabled: !!actionId,
    staleTime: FAST_REFRESH_INTERVAL,
    refetchInterval: FAST_REFRESH_INTERVAL,
  });
}

// remote action mutation
export function useRemoteAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RemoteActionRequest) => triggerRemoteAction(request),
    onSuccess: (_, variables) => {
      // invalidate action results to refresh
      queryClient.invalidateQueries({
        queryKey: ["action-results", variables.childId],
      });
    },
  });
}

// sync mutation
export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      childId,
      syncType,
    }: {
      childId: string;
      syncType: "contacts" | "sms" | "calls" | "apps" | "all";
    }) => triggerSync(childId, syncType),
    onSuccess: (_, variables) => {
      // invalidate relevant queries
      if (variables.syncType === "all") {
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        queryClient.invalidateQueries({ queryKey: ["sms"] });
        queryClient.invalidateQueries({ queryKey: ["call-logs"] });
        queryClient.invalidateQueries({ queryKey: ["apps"] });
      } else {
        const keyMap: Record<string, string> = {
          contacts: "contacts",
          sms: "sms",
          calls: "call-logs",
          apps: "apps",
        };
        queryClient.invalidateQueries({
          queryKey: [keyMap[variables.syncType]],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["action-results"] });
    },
  });
}

// prefetch helpers
export function usePrefetchContacts() {
  const queryClient = useQueryClient();

  return (childId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["contacts", childId, undefined],
      queryFn: () => fetchContacts(childId),
    });
  };
}

export function usePrefetchSms() {
  const queryClient = useQueryClient();

  return (childId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["sms", childId, undefined],
      queryFn: () => fetchSmsLogs(childId),
    });
  };
}

export function usePrefetchCallLogs() {
  const queryClient = useQueryClient();

  return (childId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["call-logs", childId, undefined],
      queryFn: () => fetchCallLogs(childId),
    });
  };
}

export function usePrefetchApps() {
  const queryClient = useQueryClient();

  return (childId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["apps", childId, undefined],
      queryFn: () => fetchInstalledApps(childId),
    });
  };
}

// photos hook with fast refresh
export function usePhotos(
  childId: string | null,
  params?: { limit?: number; offset?: number },
) {
  return useQuery<PhotosResponse>({
    queryKey: ["photos", childId, params],
    queryFn: () => fetchPhotos(childId!, params),
    enabled: !!childId,
    staleTime: FAST_REFRESH_INTERVAL,
    refetchInterval: FAST_REFRESH_INTERVAL,
  });
}

// recordings hook with fast refresh
export function useRecordings(
  childId: string | null,
  params?: { limit?: number; offset?: number },
) {
  return useQuery<RecordingsResponse>({
    queryKey: ["recordings", childId, params],
    queryFn: () => fetchRecordings(childId!, params),
    enabled: !!childId,
    staleTime: FAST_REFRESH_INTERVAL,
    refetchInterval: FAST_REFRESH_INTERVAL,
  });
}
