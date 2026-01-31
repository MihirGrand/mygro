"use client";

import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  RefreshCw,
  Camera,
  MapPin,
  Volume2,
  Lock,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Image as ImageIcon,
  Mic,
  Eye,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useDevices } from "~/hooks/useDevices";
import { useActionResults, useRemoteAction } from "~/hooks/useData";
import type { ActionType, ActionStatus } from "~/lib/api/client";

const ITEMS_PER_PAGE = 20;

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

const ACTION_TYPE_CONFIG: Record<
  ActionType,
  { label: string; icon: typeof Camera; color: string }
> = {
  TAKE_PHOTO: { label: "Photo", icon: Camera, color: "text-purple-500" },
  TAKE_SCREENSHOT: {
    label: "Screenshot",
    icon: ImageIcon,
    color: "text-blue-500",
  },
  GET_LOCATION: { label: "Location", icon: MapPin, color: "text-orange-500" },
  SYNC_CONTACTS: { label: "Sync Contacts", icon: Smartphone, color: "text-cyan-500" },
  SYNC_SMS: { label: "Sync SMS", icon: Smartphone, color: "text-cyan-500" },
  SYNC_CALL_LOGS: { label: "Sync Calls", icon: Smartphone, color: "text-cyan-500" },
  SYNC_APPS: { label: "Sync Apps", icon: Smartphone, color: "text-cyan-500" },
  SYNC_ALL: { label: "Full Sync", icon: RefreshCw, color: "text-green-500" },
  LOCK_DEVICE: { label: "Lock", icon: Lock, color: "text-red-500" },
  RING_DEVICE: { label: "Ring", icon: Volume2, color: "text-yellow-500" },
  RECORD_AUDIO: { label: "Audio", icon: Mic, color: "text-pink-500" },
  GET_CLIPBOARD: { label: "Clipboard", icon: Smartphone, color: "text-gray-500" },
};

const STATUS_CONFIG: Record<
  ActionStatus,
  { label: string; icon: typeof CheckCircle; color: string; bg: string }
> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  QUEUED: {
    label: "Queued",
    icon: Clock,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  PROCESSING: {
    label: "Processing",
    icon: Loader2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
};

function ActionTypeBadge({ type }: { type: ActionType }) {
  const config = ACTION_TYPE_CONFIG[type] || {
    label: type,
    icon: Activity,
    color: "text-gray-500",
  };
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", config.color)} />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: ActionStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-1",
        config.bg
      )}
    >
      <Icon
        className={cn(
          "h-3 w-3",
          config.color,
          status === "PROCESSING" && "animate-spin"
        )}
      />
      <span className={cn("text-xs font-medium", config.color)}>
        {config.label}
      </span>
    </div>
  );
}

export default function ResultsPage() {
  const { selectedDevice, isLoading: isLoadingDevices } = useDevices();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState<ActionType | "all">("all");
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const {
    data: resultsData,
    isLoading: isLoadingResults,
    isFetching,
    refetch,
  } = useActionResults(selectedDevice?.id || null, {
    actionType: selectedTab === "all" ? undefined : selectedTab,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  });

  const remoteAction = useRemoteAction();

  const results = resultsData?.results || [];
  const totalResults = resultsData?.total || 0;
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);

  const handleTabChange = (value: string) => {
    setSelectedTab(value as ActionType | "all");
    setCurrentPage(1);
  };

  const handleViewDetails = (result: any) => {
    setSelectedResult(result);
    setShowDetailDialog(true);
  };

  const triggerAction = async (action: ActionType) => {
    if (!selectedDevice?.id) return;
    try {
      await remoteAction.mutateAsync({
        childId: selectedDevice.id,
        action,
      });
    } catch (error) {
      console.error("Action failed:", error);
    }
  };

  if (isLoadingDevices) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!selectedDevice) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Activity className="text-muted-foreground h-16 w-16 opacity-50" />
        <div className="text-muted-foreground text-center">
          <p className="text-lg font-medium">No device selected</p>
          <p className="mt-1 text-sm">
            Connect a child device to view action results
          </p>
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
            <h1 className="text-xl font-bold">Remote Action Results</h1>
            <p className="text-muted-foreground text-sm">
              {totalResults} results from {selectedDevice.deviceName}
              {isFetching && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Refreshing...
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* quick actions */}
      <div className="shrink-0 border-b px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground mr-2 text-sm">
            Quick Actions:
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerAction("TAKE_PHOTO")}
            disabled={remoteAction.isPending}
          >
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerAction("TAKE_SCREENSHOT")}
            disabled={remoteAction.isPending}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Screenshot
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerAction("GET_LOCATION")}
            disabled={remoteAction.isPending}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Get Location
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerAction("RING_DEVICE")}
            disabled={remoteAction.isPending}
          >
            <Volume2 className="mr-2 h-4 w-4" />
            Ring Device
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerAction("SYNC_ALL")}
            disabled={remoteAction.isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Full Sync
          </Button>
        </div>
      </div>

      {/* tabs */}
      <Tabs
        value={selectedTab}
        onValueChange={handleTabChange}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="shrink-0 border-b px-6">
          <TabsList className="h-auto p-0">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="TAKE_PHOTO"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary"
            >
              Photos
            </TabsTrigger>
            <TabsTrigger
              value="TAKE_SCREENSHOT"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary"
            >
              Screenshots
            </TabsTrigger>
            <TabsTrigger
              value="GET_LOCATION"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary"
            >
              Locations
            </TabsTrigger>
            <TabsTrigger
              value="RECORD_AUDIO"
              className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary"
            >
              Audio
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedTab} className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {isLoadingResults ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Activity className="text-muted-foreground h-12 w-12 opacity-50" />
                  <p className="text-muted-foreground mt-4 text-center">
                    No action results yet
                  </p>
                  <p className="text-muted-foreground mt-1 text-center text-sm">
                    Trigger a remote action to see results here
                  </p>
                </div>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-40">Action</TableHead>
                        <TableHead className="w-28">Status</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead className="w-44">Created</TableHead>
                        <TableHead className="w-44">Completed</TableHead>
                        <TableHead className="w-20 text-right">View</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell>
                            <ActionTypeBadge type={result.actionType} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={result.status} />
                          </TableCell>
                          <TableCell>
                            {result.error ? (
                              <span className="text-sm text-red-500">
                                {result.error}
                              </span>
                            ) : result.imageUrl ? (
                              <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-purple-500" />
                                <span className="text-sm">Image captured</span>
                              </div>
                            ) : result.audioUrl ? (
                              <div className="flex items-center gap-2">
                                <Mic className="h-4 w-4 text-pink-500" />
                                <span className="text-sm">Audio recorded</span>
                              </div>
                            ) : result.latitude && result.longitude ? (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-orange-500" />
                                <span className="font-mono text-sm">
                                  {result.latitude.toFixed(4)},{" "}
                                  {result.longitude.toFixed(4)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {result.status === "COMPLETED"
                                  ? "Success"
                                  : "-"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground text-sm">
                              {formatDateTime(result.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground text-sm">
                              {result.completedAt
                                ? formatDateTime(result.completedAt)
                                : "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(result)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="shrink-0 border-t px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalResults)} of{" "}
              {totalResults} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* detail dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Action Result Details</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">Action Type</p>
                  <div className="mt-1">
                    <ActionTypeBadge type={selectedResult.actionType} />
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={selectedResult.status} />
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Created</p>
                  <p className="mt-1 text-sm font-medium">
                    {formatDateTime(selectedResult.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Completed</p>
                  <p className="mt-1 text-sm font-medium">
                    {selectedResult.completedAt
                      ? formatDateTime(selectedResult.completedAt)
                      : "-"}
                  </p>
                </div>
              </div>

              {selectedResult.error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-sm font-medium text-red-500">Error</p>
                  <p className="mt-1 text-sm text-red-400">
                    {selectedResult.error}
                  </p>
                </div>
              )}

              {selectedResult.imageUrl && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">
                    Captured Image
                  </p>
                  <div className="overflow-hidden rounded-lg border">
                    <img
                      src={selectedResult.imageUrl}
                      alt="Captured"
                      className="h-auto w-full"
                    />
                  </div>
                </div>
              )}

              {selectedResult.audioUrl && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">
                    Recorded Audio
                  </p>
                  <audio
                    controls
                    src={selectedResult.audioUrl}
                    className="w-full"
                  />
                </div>
              )}

              {selectedResult.latitude && selectedResult.longitude && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">Location</p>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-orange-500" />
                      <span className="font-mono">
                        {selectedResult.latitude.toFixed(6)},{" "}
                        {selectedResult.longitude.toFixed(6)}
                      </span>
                    </div>
                    {selectedResult.accuracy && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        Accuracy: ±{selectedResult.accuracy.toFixed(0)}m
                      </p>
                    )}
                    <a
                      href={`https://www.google.com/maps?q=${selectedResult.latitude},${selectedResult.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary mt-2 inline-block text-sm hover:underline"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                </div>
              )}

              {selectedResult.result && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">
                    Raw Result
                  </p>
                  <pre className="bg-muted max-h-48 overflow-auto rounded-lg p-4 font-mono text-xs">
                    {JSON.stringify(selectedResult.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
