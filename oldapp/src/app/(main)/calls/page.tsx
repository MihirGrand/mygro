"use client";

import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RefreshCw,
  Loader2,
  User,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useDevices } from "~/hooks/useDevices";
import { useCallLogs, useTriggerSync } from "~/hooks/useData";

type CallType = "INCOMING" | "OUTGOING" | "MISSED" | "REJECTED" | "BLOCKED";

const ITEMS_PER_PAGE = 25;

function formatDuration(seconds: number): string {
  if (seconds === 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

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
  });
}

function CallTypeBadge({ type }: { type: CallType }) {
  const config: Record<
    CallType,
    { bg: string; text: string; label: string; icon: typeof Phone }
  > = {
    INCOMING: {
      bg: "bg-green-500/10",
      text: "text-green-600",
      label: "Incoming",
      icon: PhoneIncoming,
    },
    OUTGOING: {
      bg: "bg-blue-500/10",
      text: "text-blue-600",
      label: "Outgoing",
      icon: PhoneOutgoing,
    },
    MISSED: {
      bg: "bg-red-500/10",
      text: "text-red-600",
      label: "Missed",
      icon: PhoneMissed,
    },
    REJECTED: {
      bg: "bg-orange-500/10",
      text: "text-orange-600",
      label: "Rejected",
      icon: PhoneMissed,
    },
    BLOCKED: {
      bg: "bg-gray-500/10",
      text: "text-gray-600",
      label: "Blocked",
      icon: PhoneMissed,
    },
  };

  const { bg, text, label, icon: Icon } = config[type] || config.MISSED;

  return (
    <div className={cn("flex items-center gap-1.5 rounded-full px-2 py-1", bg)}>
      <Icon className={cn("h-3 w-3", text)} />
      <span className={cn("text-xs font-medium", text)}>{label}</span>
    </div>
  );
}

export default function CallsPage() {
  const { selectedDevice, isLoading: isLoadingDevices } = useDevices();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: callsData,
    isLoading: isLoadingCalls,
    isFetching,
  } = useCallLogs(selectedDevice?.id || null, {
    phoneNumber: searchQuery || undefined,
    callType: typeFilter !== "all" ? typeFilter : undefined,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  });

  const triggerSync = useTriggerSync();

  const callLogs = callsData?.callLogs || [];
  const totalCalls = callsData?.total || 0;
  const totalPages = Math.ceil(totalCalls / ITEMS_PER_PAGE);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleSync = async () => {
    if (!selectedDevice?.id) return;
    try {
      await triggerSync.mutateAsync({
        childId: selectedDevice.id,
        syncType: "calls",
      });
    } catch (error) {
      console.error("Sync failed:", error);
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
        <Phone className="text-muted-foreground h-16 w-16 opacity-50" />
        <div className="text-muted-foreground text-center">
          <p className="text-lg font-medium">No device selected</p>
          <p className="mt-1 text-sm">
            Connect a child device to view call logs
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
            <h1 className="text-xl font-bold">Call Logs</h1>
            <p className="text-muted-foreground text-sm">
              {totalCalls} calls from {selectedDevice.deviceName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={triggerSync.isPending}
            >
              {triggerSync.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Calls
            </Button>
          </div>
        </div>
      </div>

      {/* filters */}
      <div className="shrink-0 border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by phone number..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="INCOMING">Incoming</SelectItem>
              <SelectItem value="OUTGOING">Outgoing</SelectItem>
              <SelectItem value="MISSED">Missed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
          {isFetching && !isLoadingCalls && (
            <div className="flex items-center gap-2">
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
              <span className="text-muted-foreground text-sm">Updating...</span>
            </div>
          )}
        </div>
      </div>

      {/* content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoadingCalls ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : callLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Phone className="text-muted-foreground h-12 w-12 opacity-50" />
              <p className="text-muted-foreground mt-4 text-center">
                {searchQuery || typeFilter !== "all"
                  ? "No calls found matching your filter"
                  : "No call logs synced yet"}
              </p>
              {!searchQuery && typeFilter === "all" && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleSync}
                  disabled={triggerSync.isPending}
                >
                  {triggerSync.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync Now
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Type</TableHead>
                    <TableHead className="w-40">Contact</TableHead>
                    <TableHead className="w-40">Phone Number</TableHead>
                    <TableHead className="w-28">Duration</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callLogs.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>
                        <CallTypeBadge type={call.callType as CallType} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                            <User className="text-muted-foreground h-4 w-4" />
                          </div>
                          <span className="truncate font-medium">
                            {call.contactName || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {call.phoneNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {formatDuration(call.duration)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm">
                          <p className="font-medium">
                            {formatTime(call.timestamp)}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatDate(call.timestamp)}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="shrink-0 border-t px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCalls)} of{" "}
              {totalCalls} calls
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
    </div>
  );
}
