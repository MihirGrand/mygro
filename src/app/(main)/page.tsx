"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Inbox,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { AgentPanel } from "~/components/agent";
import { fetchUserTickets } from "~/lib/api/tickets";
import type { Ticket } from "~/lib/api/tickets";

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
  const time = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
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
      return firstUserMessage.content.slice(0, 60) + (firstUserMessage.content.length > 60 ? "..." : "");
    }
  }
  return `Ticket ${ticket.ticket_id}`;
}

// get ticket description from chat history
function getTicketDescription(ticket: Ticket): string {
  if (ticket.chat_history && ticket.chat_history.length > 0) {
    const lastAssistantMessage = [...ticket.chat_history].reverse().find((m) => m.role === "assistant");
    if (lastAssistantMessage) {
      return lastAssistantMessage.content.slice(0, 100) + (lastAssistantMessage.content.length > 100 ? "..." : "");
    }
  }
  return "No messages yet";
}

// ticket card component
function TicketCard({
  ticket,
  onClick,
  isSelected,
}: {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
  isSelected?: boolean;
}) {
  const status = statusConfig[ticket.status] || statusConfig.open;
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
  const StatusIcon = status.icon;
  const messageCount = ticket.chat_history?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        className={cn(
          "group cursor-pointer border p-4 transition-all hover:border-border",
          isSelected
            ? "border-primary/50 bg-primary/5"
            : "border-transparent bg-card hover:bg-muted/50",
        )}
        onClick={() => onClick?.(ticket)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">{ticket.ticket_id}</span>
              <span className={cn("text-xs font-medium", priority.className)}>
                {priority.label}
              </span>
            </div>

            <h3 className="text-foreground mt-1 truncate text-sm font-medium">
              {getTicketTitle(ticket)}
            </h3>

            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
              {getTicketDescription(ticket)}
            </p>

            <div className="mt-3 flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs",
                  status.className,
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

// quick action card
function QuickActionCard({
  icon: Icon,
  label,
  description,
  onClick,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  variant?: "default" | "primary" | "warning";
}) {
  return (
    <Card
      className={cn(
        "group cursor-pointer border p-4 transition-all hover:border-border",
        variant === "primary" &&
          "border-primary/20 bg-primary/5 hover:border-primary/40",
        variant === "warning" &&
          "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40",
        variant === "default" && "border-transparent bg-card hover:bg-muted/50",
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            variant === "primary" && "bg-primary/10 text-primary",
            variant === "warning" && "bg-amber-500/10 text-amber-500",
            variant === "default" && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "text-sm font-medium",
              variant === "primary" && "text-primary",
              variant === "warning" && "text-amber-600 dark:text-amber-400",
              variant === "default" && "text-foreground",
            )}
          >
            {label}
          </h3>
          <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
        </div>
      </div>
    </Card>
  );
}

// empty state component
function EmptyState({
  type = "no-tickets",
  onCreateTicket,
}: {
  type?: "no-tickets" | "no-results";
  onCreateTicket: () => void;
}) {
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
        No tickets yet
      </h3>
      <p className="text-muted-foreground mt-1 max-w-xs text-center text-sm">
        Start a conversation with our AI agent to create your first ticket.
      </p>
      <Button size="sm" onClick={onCreateTicket} className="mt-5 gap-1.5">
        <Plus className="h-4 w-4" />
        Start Conversation
      </Button>
    </motion.div>
  );
}

// main page
export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // fetch tickets on mount
  useEffect(() => {
    loadTickets();
  }, []);

  // load tickets from api
  const loadTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const data = await fetchUserTickets();
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

    const matchesSearch =
      searchQuery === "" ||
      title.includes(searchQuery.toLowerCase()) ||
      description.includes(searchQuery.toLowerCase()) ||
      ticketId.includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // handle ticket selection
  const handleTicketSelect = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
  }, []);

  // handle create ticket (focus agent panel)
  const handleStartConversation = useCallback(() => {
    setSelectedTicket(null);
  }, []);

  // handle new ticket created from agent
  const handleTicketCreated = useCallback((ticketId: string) => {
    // refresh tickets list when new ticket is created
    loadTickets();
  }, [loadTickets]);

  // handle view docs
  const handleViewDocs = useCallback(() => {
    window.open("/api/docs", "_blank");
  }, []);

  return (
    <div className="flex h-full w-full">
      {/* main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <div className="border-border/40 flex flex-col gap-4 border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-xl font-semibold">
                Support Center
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Manage tickets and get help with platform migration
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadTickets}
                disabled={isLoadingTickets}
                className="gap-1.5"
              >
                <RefreshCw className={cn("h-4 w-4", isLoadingTickets && "animate-spin")} />
                Refresh
              </Button>

            </div>
          </div>

          {/* quick actions */}
          <div className="grid gap-3 sm:grid-cols-3">
            <QuickActionCard
              icon={Plus}
              label="New Conversation"
              description="Start a support conversation"
              onClick={handleStartConversation}
              variant="primary"
            />
            <QuickActionCard
              icon={FileText}
              label="Documentation"
              description="Browse API docs & guides"
              onClick={handleViewDocs}
            />
            <QuickActionCard
              icon={AlertTriangle}
              label="Report Issue"
              description="Report a bug or problem"
              onClick={handleStartConversation}
              variant="warning"
            />
          </div>
        </div>

        {/* tickets section */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* filters */}
          <div className="border-border/40 flex items-center gap-3 border-b px-6 py-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-1">
              {["all", "open", "in_progress", "resolved"].map((status) => (
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
                <div className="flex flex-col items-center justify-center py-16">
                  <RefreshCw className="text-muted-foreground h-6 w-6 animate-spin" />
                  <p className="text-muted-foreground mt-3 text-sm">Loading tickets...</p>
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
                      />
                    ))
                  ) : tickets.length > 0 ? (
                    <EmptyState type="no-results" onCreateTicket={handleStartConversation} />
                  ) : (
                    <EmptyState type="no-tickets" onCreateTicket={handleStartConversation} />
                  )}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* agent panel - fixed width on right */}
      <div className="border-border/40 hidden h-full w-[28rem] shrink-0 border-l lg:block">
        <AgentPanel
          selectedTicketId={selectedTicket?._id}
          ticketChatHistory={selectedTicket?.chat_history}
          onTicketCreated={handleTicketCreated}
        />
      </div>
    </div>
  );
}
