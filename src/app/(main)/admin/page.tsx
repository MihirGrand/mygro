"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  User,
  BarChart3,
  Users,
  AlertOctagon,
  TrendingUp,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { AdminChatPanel } from "~/components/agent/AdminChatPanel";
import { fetchAssignedTickets } from "~/lib/api/tickets";
import type { Ticket } from "~/lib/api/tickets";
import useUser from "~/hooks/useUser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// status config
const statusConfig = {
  open: {
    label: "Open",
    icon: AlertCircle,
    className: "text-amber-500 bg-amber-500/10",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className: "text-blue-500 bg-blue-500/10",
  },
  escalated: {
    label: "Escalated",
    icon: AlertCircle,
    className: "text-orange-500 bg-orange-500/10",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    className: "text-emerald-500 bg-emerald-500/10",
  },
  closed: {
    label: "Closed",
    icon: CheckCircle2,
    className: "text-muted-foreground bg-muted",
  },
};

// priority config
const priorityConfig = {
  low: { label: "Low", className: "text-muted-foreground" },
  medium: { label: "Medium", className: "text-amber-500" },
  high: { label: "High", className: "text-orange-500" },
  urgent: { label: "Urgent", className: "text-red-500" },
};

// format relative time
function formatRelativeTime(timestamp: string | number): string {
  const time =
    typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
  const now = Date.now();
  const diff = now - time;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(time).toLocaleDateString();
}

// get ticket title from chat history or fallback
function getTicketTitle(ticket: Ticket): string {
  if (ticket.title) return ticket.title;
  if (ticket.chat_history && ticket.chat_history.length > 0) {
    const firstUserMessage = ticket.chat_history.find((m) => m.role === "user");
    if (firstUserMessage) {
      return (
        firstUserMessage.content.slice(0, 60) +
        (firstUserMessage.content.length > 60 ? "..." : "")
      );
    }
  }
  return `Ticket ${ticket.ticket_id}`;
}

// get ticket description from chat history
function getTicketDescription(ticket: Ticket): string {
  if (ticket.chat_history && ticket.chat_history.length > 0) {
    const lastMessage = [...ticket.chat_history].reverse()[0];
    if (lastMessage) {
      return (
        lastMessage.content.slice(0, 100) +
        (lastMessage.content.length > 100 ? "..." : "")
      );
    }
  }
  return "No messages yet";
}

// analytics types
interface TopError {
  _id: string;
  count: number;
}

interface SignalFrequency {
  _id: string;
  count: number;
}

interface AffectedMerchants {
  unique_merchants: number;
}

interface AnalyticsData {
  signal_frequency: SignalFrequency[];
  top_errors: TopError[];
  unique_merchants: number;
}

// analytics section component
function AnalyticsSection({ data, isLoading }: { data: AnalyticsData | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 border border-border/40 animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-2" />
            <div className="h-8 bg-muted rounded w-16" />
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const topErrors = data.top_errors || [];
  const signalFrequency = data.signal_frequency || [];
  const affectedMerchants = data.unique_merchants || 0;
  const totalSignals = signalFrequency.reduce((acc, s) => acc + s.count, 0);
  const totalErrors = topErrors.reduce((acc, e) => acc + e.count, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-3 mb-6">
      {/* top errors card */}
      <Card className="p-4 border border-border/40 bg-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
            <AlertOctagon className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Top Errors</p>
            <p className="text-foreground text-lg font-semibold">{totalErrors}</p>
          </div>
        </div>
        <div className="space-y-2">
          {topErrors.slice(0, 3).map((error) => (
            <div key={error._id} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {error._id.replace(/_/g, " ")}
              </span>
              <span className="text-xs font-medium text-foreground bg-muted px-1.5 py-0.5 rounded">
                {error.count}
              </span>
            </div>
          ))}
          {topErrors.length === 0 && (
            <p className="text-xs text-muted-foreground">No errors recorded</p>
          )}
        </div>
      </Card>

      {/* signal frequency card */}
      <Card className="p-4 border border-border/40 bg-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Signal Frequency</p>
            <p className="text-foreground text-lg font-semibold">{totalSignals}</p>
          </div>
        </div>
        <div className="space-y-2">
          {signalFrequency.slice(0, 3).map((signal) => {
            const date = new Date(signal._id);
            const formatted = !isNaN(date.getTime())
              ? date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric" })
              : signal._id;
            return (
              <div key={signal._id} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatted}</span>
                <span className="text-xs font-medium text-foreground bg-muted px-1.5 py-0.5 rounded">
                  {signal.count}
                </span>
              </div>
            );
          })}
          {signalFrequency.length === 0 && (
            <p className="text-xs text-muted-foreground">No signals recorded</p>
          )}
        </div>
      </Card>

      {/* affected merchants card */}
      <Card className="p-4 border border-border/40 bg-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <Users className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Affected Merchants</p>
            <p className="text-foreground text-lg font-semibold">{affectedMerchants}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {affectedMerchants === 0
            ? "No merchants affected"
            : affectedMerchants === 1
              ? "1 unique merchant impacted"
              : `${affectedMerchants} unique merchants impacted`}
        </p>
      </Card>
    </div>
  );
}

// ticket card component
function TicketCard({
  ticket,
  onClick,
  isSelected,
  isInitialRender,
}: {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
  isSelected?: boolean;
  isInitialRender?: boolean;
}) {
  const status = statusConfig[ticket.status] || statusConfig.open;
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
  const StatusIcon = status.icon;
  const messageCount = ticket.chat_history?.length || 0;

  return (
    <motion.div
      initial={isInitialRender ? { opacity: 0, y: 4 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      layout
    >
      <Card
        className={cn(
          "group cursor-pointer border p-4 transition-all hover:border-border",
          isSelected
            ? "border-primary/50 bg-primary/5"
            : "border-transparent bg-card hover:bg-muted/50"
        )}
        onClick={() => onClick?.(ticket)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {ticket.ticket_id}
              </span>
              <span className={cn("text-xs font-medium", priority.className)}>
                {priority.label}
              </span>
            </div>

            <h3 className="text-foreground mt-1 truncate text-sm font-medium">
              {getTicketTitle(ticket)}
            </h3>

            {/* merchant info */}
            {ticket.merchant && (
              <div className="mt-1 flex items-center gap-1.5">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground text-xs">
                  {ticket.merchant.name}
                </span>
              </div>
            )}

            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
              {getTicketDescription(ticket)}
            </p>

            <div className="mt-3 flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs",
                  status.className
                )}
              >
                <StatusIcon className="h-3 w-3" />
                <span>{status.label}</span>
              </div>

              <span className="text-muted-foreground/60 text-xs">
                {formatRelativeTime(ticket.updated_at || ticket.created_at)}
              </span>

              {messageCount > 0 && (
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <MessageSquare className="h-3 w-3" />
                  <span>{messageCount}</span>
                </div>
              )}
            </div>
          </div>

          <ChevronRight className="text-muted-foreground/40 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Card>
    </motion.div>
  );
}

// empty state component
function EmptyState({ type = "no-tickets" }: { type?: "no-tickets" | "no-results" }) {
  if (type === "no-results") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <div className="bg-muted/50 flex h-14 w-14 items-center justify-center rounded-full">
          <Search className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="text-foreground mt-4 text-sm font-medium">
          No matching tickets
        </h3>
        <p className="text-muted-foreground mt-1 max-w-xs text-center text-sm">
          Try adjusting your search or filter criteria.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="bg-muted/50 flex h-14 w-14 items-center justify-center rounded-full">
        <Inbox className="text-muted-foreground h-7 w-7" />
      </div>
      <h3 className="text-foreground mt-4 text-sm font-medium">
        No escalated tickets
      </h3>
      <p className="text-muted-foreground mt-1 max-w-xs text-center text-sm">
        When users request human support, their tickets will appear here.
      </p>
    </motion.div>
  );
}

// main admin page
export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: userLoading, isAdmin } = useUser();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const isInitialRenderRef = useRef(true);

  // redirect non-admin users
  useEffect(() => {
    if (!userLoading && (!user || !isAdmin)) {
      toast.error("Access denied. Admin only.");
      router.replace("/");
    }
  }, [user, userLoading, isAdmin, router]);

  // fetch tickets on mount
  useEffect(() => {
    if (isAdmin) {
      loadTickets();
      loadAnalytics();
    }
  }, [isAdmin]);

  // mark initial render as complete after first load
  useEffect(() => {
    if (!isLoadingTickets && isInitialRenderRef.current) {
      const timer = setTimeout(() => {
        isInitialRenderRef.current = false;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoadingTickets]);

  // load analytics from api
  const loadAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    try {
      const response = await fetch("https://abstruse.app.n8n.cloud/webhook/analytics");
      const data = await response.json();
      // api returns array of objects, merge them into single object
      if (Array.isArray(data)) {
        const merged: AnalyticsData = {
          signal_frequency: [],
          top_errors: [],
          unique_merchants: 0,
        };
        for (const item of data) {
          if (item.signal_frequency) merged.signal_frequency = item.signal_frequency;
          if (item.top_errors) merged.top_errors = item.top_errors;
          if (item.unique_merchants !== undefined) merged.unique_merchants = item.unique_merchants;
        }
        setAnalytics(merged);
      } else {
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
      setAnalytics(null);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  // load tickets from api
  const loadTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const data = await fetchAssignedTickets();
      setTickets(data);
    } catch (error) {
      console.error("Failed to load tickets:", error);
      setTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  }, []);

  // filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const title = getTicketTitle(ticket).toLowerCase();
    const description = getTicketDescription(ticket).toLowerCase();
    const ticketId = ticket.ticket_id.toLowerCase();
    const merchantEmail = ticket.merchant?.email?.toLowerCase() || "";
    const merchantName = ticket.merchant?.name?.toLowerCase() || "";

    const matchesSearch =
      searchQuery === "" ||
      title.includes(searchQuery.toLowerCase()) ||
      description.includes(searchQuery.toLowerCase()) ||
      ticketId.includes(searchQuery.toLowerCase()) ||
      merchantEmail.includes(searchQuery.toLowerCase()) ||
      merchantName.includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // handle ticket selection
  const handleTicketSelect = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
  }, []);

  // handle ticket resolved or reopened
  const handleTicketUpdated = useCallback(() => {
    loadTickets();
    // refresh selected ticket data
    if (selectedTicket) {
      fetchAssignedTickets().then((data) => {
        const updated = data.find((t) => t._id === selectedTicket._id);
        if (updated) {
          setSelectedTicket(updated);
        }
      });
    }
  }, [loadTickets, selectedTicket]);

  if (userLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex h-full w-full">
      {/* main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <div className="border-border/40 flex flex-col gap-4 border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-xl font-semibold">
                Assigned Tickets
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Manage escalated support tickets requiring human assistance
              </p>
            </div>

            <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { loadTickets(); loadAnalytics(); }}
                  disabled={isLoadingTickets || isLoadingAnalytics}
                  className="gap-1.5"
                >
                  <RefreshCw
                    className={cn("h-4 w-4", (isLoadingTickets || isLoadingAnalytics) && "animate-spin")}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {/* analytics section */}
            <AnalyticsSection data={analytics} isLoading={isLoadingAnalytics} />
          </div>

        {/* tickets section */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* filters */}
          <div className="border-border/40 flex items-center gap-3 border-b px-6 py-3">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by ticket, user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-1">
              {["all", "escalated", "in_progress", "resolved"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-3 text-xs capitalize"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "all"
                    ? "All"
                    : status === "in_progress"
                      ? "In Progress"
                      : status}
                </Button>
              ))}
            </div>
          </div>

          {/* ticket list */}
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-2 p-6">
              {isLoadingTickets ? (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-4 border border-border/40 animate-pulse">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                          <div className="h-3 bg-muted rounded w-1/4 mt-3" />
                        </div>
                        <div className="h-6 w-16 bg-muted rounded-full" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => (
                      <TicketCard
                        key={ticket._id}
                        ticket={ticket}
                        onClick={handleTicketSelect}
                        isSelected={ticket._id === selectedTicket?._id}
                        isInitialRender={isInitialRenderRef.current}
                      />
                    ))
                  ) : tickets.length > 0 ? (
                    <EmptyState type="no-results" />
                  ) : (
                    <EmptyState type="no-tickets" />
                  )}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* chat panel - fixed width on right */}
      <div className="border-border/40 hidden h-full w-[28rem] shrink-0 border-l lg:block">
        <AdminChatPanel
          selectedTicket={selectedTicket}
          onTicketUpdated={handleTicketUpdated}
        />
      </div>
    </div>
  );
}
