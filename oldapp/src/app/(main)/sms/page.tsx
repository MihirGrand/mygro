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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  RefreshCw,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  User,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useDevices } from "~/hooks/useDevices";
import { useSmsLogs, useSmsConversations, useTriggerSync } from "~/hooks/useData";

const ITEMS_PER_PAGE = 25;

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

function formatDateTime(dateString: string): string {
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return formatTime(dateString);
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return formatDate(dateString);
}

function MessageTypeBadge({ type }: { type: "SENT" | "RECEIVED" }) {
  const config = {
    SENT: {
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      icon: ArrowUpRight,
      label: "Sent",
    },
    RECEIVED: {
      bg: "bg-green-500/10",
      text: "text-green-500",
      icon: ArrowDownLeft,
      label: "Received",
    },
  };

  const { bg, text, icon: Icon, label } = config[type];

  return (
    <div className={cn("flex items-center gap-1.5 rounded-full px-2 py-1", bg)}>
      <Icon className={cn("h-3 w-3", text)} />
      <span className={cn("text-xs font-medium", text)}>{label}</span>
    </div>
  );
}

export default function SmsPage() {
  const { selectedDevice, isLoading: isLoadingDevices } = useDevices();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showConversationDialog, setShowConversationDialog] = useState(false);

  const {
    data: smsData,
    isLoading: isLoadingSms,
    isFetching,
  } = useSmsLogs(selectedDevice?.id || null, {
    phoneNumber: selectedConversation || undefined,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  });

  const { data: conversations, isLoading: isLoadingConversations } =
    useSmsConversations(selectedDevice?.id || null);

  const triggerSync = useTriggerSync();

  const smsLogs = smsData?.smsLogs || [];
  const totalSms = smsData?.total || 0;
  const totalPages = Math.ceil(totalSms / ITEMS_PER_PAGE);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSync = async () => {
    if (!selectedDevice?.id) return;
    try {
      await triggerSync.mutateAsync({
        childId: selectedDevice.id,
        syncType: "sms",
      });
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  const handleConversationSelect = (phoneNumber: string) => {
    setSelectedConversation(phoneNumber);
    setShowConversationDialog(false);
    setCurrentPage(1);
  };

  const clearConversationFilter = () => {
    setSelectedConversation(null);
    setCurrentPage(1);
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
        <Mail className="text-muted-foreground h-16 w-16 opacity-50" />
        <div className="text-muted-foreground text-center">
          <p className="text-lg font-medium">No device selected</p>
          <p className="mt-1 text-sm">Connect a child device to view SMS</p>
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
            <h1 className="text-xl font-bold">SMS Messages</h1>
            <p className="text-muted-foreground text-sm">
              {totalSms} messages from {selectedDevice.deviceName}
              {selectedConversation && ` • Filtered by ${selectedConversation}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConversationDialog(true)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Conversations
            </Button>
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
              Sync SMS
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
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {selectedConversation && (
            <Button variant="ghost" size="sm" onClick={clearConversationFilter}>
              Clear filter: {selectedConversation}
            </Button>
          )}
          {isFetching && !isLoadingSms && (
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
          {isLoadingSms ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : smsLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Mail className="text-muted-foreground h-12 w-12 opacity-50" />
              <p className="text-muted-foreground mt-4 text-center">
                {searchQuery || selectedConversation
                  ? "No messages found matching your filter"
                  : "No SMS messages synced yet"}
              </p>
              {!searchQuery && !selectedConversation && (
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
                    <TableHead className="w-40">Phone</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-32 text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {smsLogs.map((sms) => (
                    <TableRow key={sms.id}>
                      <TableCell>
                        <MessageTypeBadge type={sms.messageType} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                            <User className="text-muted-foreground h-4 w-4" />
                          </div>
                          <span className="truncate font-medium">
                            {sms.contactName || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          className="text-primary font-mono text-sm hover:underline"
                          onClick={() => handleConversationSelect(sms.phoneNumber)}
                        >
                          {sms.phoneNumber}
                        </button>
                      </TableCell>
                      <TableCell>
                        <p className="line-clamp-2 text-sm">{sms.body || "-"}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm">
                          <p className="font-medium">{formatTime(sms.timestamp)}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatDate(sms.timestamp)}
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
              {Math.min(currentPage * ITEMS_PER_PAGE, totalSms)} of {totalSms}{" "}
              messages
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* conversations dialog */}
      <Dialog open={showConversationDialog} onOpenChange={setShowConversationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conversations</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : !conversations || conversations.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                No conversations found
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.phoneNumber}
                    className="hover:bg-muted flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
                    onClick={() => handleConversationSelect(conv.phoneNumber)}
                  >
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <User className="text-primary h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {conv.contactName || conv.phoneNumber}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {conv.messageCount} messages
                      </p>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {conv.lastMessageAt && formatDateTime(conv.lastMessageAt)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
