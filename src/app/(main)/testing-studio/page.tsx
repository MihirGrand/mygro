"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Activity,
  Terminal,
  Play,
  AlertTriangle,
  Wifi,
  Shield,
  AlertCircle,
  Clock,
  Zap,
  Loader2,
  Key,
  Bug,
} from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
import { getUser } from "~/hooks/useUser";

// types
interface SystemLog {
  id: string;
  timestamp: string;
  event_type: string;
  source: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  trace_id: string;
}

interface TestCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  severity: "low" | "medium" | "high" | "critical";
  eventType: string;
  errorCode: string;
  serviceSource: string;
  payload: Record<string, unknown>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const WEBHOOK_URL = "https://abstruse.app.n8n.cloud/webhook/system-signal";

// test cards with exact payloads
const TEST_CARDS: TestCard[] = [
  {
    id: "auth-failure",
    title: "Auth Failure",
    description: "Invalid API token, doesn't match environment",
    icon: <Key className="h-4 w-4" />,
    severity: "medium",
    eventType: "auth_failure",
    errorCode: "AUTH_401",
    serviceSource: "api_gateway",
    payload: {
      description: "Invalid API Token. Token does not match environment.",
      endpoint: "GET /v2/products",
      client_ip: "192.168.1.50",
    },
  },
  {
    id: "webhook-dead-letter",
    title: "Webhook Dead Letter",
    description: "Target server timed out after 10s",
    icon: <Wifi className="h-4 w-4" />,
    severity: "high",
    eventType: "webhook_dead_letter",
    errorCode: "WH_TIMEOUT",
    serviceSource: "webhook_dispatcher",
    payload: {
      description: "Target server timed out after 10s.",
      target_url: "https://api.merchant.com/orders",
      attempt_count: 5,
    },
  },
  {
    id: "cors-explosion",
    title: "CORS Explosion",
    description: "Browser blocked request, origin not allowed",
    icon: <Shield className="h-4 w-4" />,
    severity: "medium",
    eventType: "cors_explosion",
    errorCode: "CORS_BLOCK",
    serviceSource: "storefront_sdk",
    payload: {
      description: "Browser blocked request. Origin not allowed.",
      origin_domain: "https://new-checkout.merchant.com",
      blocked_resource: "https://api.platform.com/checkout",
    },
  },
  {
    id: "regression-signal",
    title: "Regression Signal",
    description: "High error rate detected after deployment",
    icon: <AlertCircle className="h-4 w-4" />,
    severity: "critical",
    eventType: "regression_signal",
    errorCode: "SYS_500",
    serviceSource: "checkout_service",
    payload: {
      description: "High error rate detected after deployment v4.5.2.",
      threshold_breached: "15% error rate",
      root_exception: "NullPointerException in PaymentController",
    },
  },
  {
    id: "null-pointer",
    title: "Null Pointer Exception",
    description: "Null reference encountered in code",
    icon: <Bug className="h-4 w-4" />,
    severity: "high",
    eventType: "null_pointer",
    errorCode: "NPE_500",
    serviceSource: "checkout_service",
    payload: {
      description: "NullPointerException in PaymentController.processOrder()",
      stack_trace: "at PaymentController.java:142",
      affected_service: "payment-processor",
    },
  },
  {
    id: "migration-delay",
    title: "Migration Delay",
    description: "Inventory sync is running behind",
    icon: <Clock className="h-4 w-4" />,
    severity: "low",
    eventType: "migration_delay",
    errorCode: "SYNC_LAG",
    serviceSource: "sync_worker",
    payload: {
      description: "Inventory sync is running 120s behind.",
      lag_seconds: 120,
      entity_type: "inventory",
    },
  },
  {
    id: "rate-limit",
    title: "Rate Limit",
    description: "Merchant exceeded request limit",
    icon: <Zap className="h-4 w-4" />,
    severity: "medium",
    eventType: "rate_limit",
    errorCode: "RATE_429",
    serviceSource: "api_gateway",
    payload: {
      description: "Merchant exceeded 100 req/sec limit.",
      current_usage: 150,
      limit_type: "concurrent_requests",
    },
  },
];

const SEVERITY_COLORS: Record<string, string> = {
  low: "text-slate-500 dark:text-slate-400",
  medium: "text-yellow-600 dark:text-yellow-500",
  high: "text-orange-600 dark:text-orange-500",
  critical: "text-red-600 dark:text-red-500",
};

// generates unique ids
function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// formats timestamp
function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function TestingStudioPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [loadingTests, setLoadingTests] = useState<Record<string, boolean>>({});
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);

  // fetch logs from api
  const fetchLogs = useCallback(async (pageNum: number, append = false) => {
    try {
      setIsLoadingMore(true);
      const response = await fetch(
        `${API_BASE_URL}/api/logs?page=${pageNum}&limit=50`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const fetchedLogs = data.data.logs || [];
          setLogs((prev) => (append ? [...prev, ...fetchedLogs] : fetchedLogs));
          setHasMore(data.data.hasMore || false);
          setPage(pageNum);
        }
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

  // initial load
  useEffect(() => {
    fetchLogs(0);
  }, [fetchLogs]);

  // infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          fetchLogs(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, page, fetchLogs]);

  // adds log to state
  const addLog = useCallback((log: SystemLog) => {
    setLogs((prev) => [log, ...prev].slice(0, 100));
    setNewLogIds(new Set([log.id]));
    setTimeout(() => setNewLogIds(new Set()), 2000);
  }, []);

  // triggers test and sends webhook
  const triggerTest = useCallback(
    async (card: TestCard) => {
      const user = getUser();
      if (!user) {
        toast.error("Please sign in to trigger tests");
        return;
      }

      setLoadingTests((prev) => ({ ...prev, [card.id]: true }));

      const timestamp = new Date().toISOString();
      const merchantId = user.id;

      // webhook payload in exact required format
      const webhookPayload = {
        event_type: card.eventType,
        severity: card.severity,
        timestamp,
        merchant_id: merchantId,
        email: user.email,
        service_source: card.serviceSource,
        error_code: card.errorCode,
        payload: card.payload,
      };

      // local log entry
      const logEntry: SystemLog = {
        id: generateId("log"),
        timestamp,
        event_type: card.eventType.toUpperCase(),
        source: card.serviceSource,
        severity: card.severity,
        message: `${card.errorCode}: ${(card.payload as { description?: string }).description || card.description}`,
        trace_id: merchantId,
      };

      addLog(logEntry);

      // save to db
      try {
        await fetch(`${API_BASE_URL}/api/logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logEntry),
        });
      } catch (error) {
        console.error("Failed to save log:", error);
      }

      // send webhook
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });

        if (response.ok) {
          toast.success(`Sent: ${card.title}`, {
            description: `${card.eventType} → Agent triggered`,
          });

          const successLog: SystemLog = {
            id: generateId("log"),
            timestamp: new Date().toISOString(),
            event_type: "WEBHOOK_SENT",
            source: "testing-studio",
            severity: "low",
            message: `Signal sent to agent: ${card.eventType}`,
            trace_id: merchantId,
          };
          addLog(successLog);

          await fetch(`${API_BASE_URL}/api/logs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(successLog),
          });
        } else {
          toast.error(`Failed: ${card.title}`, {
            description: `Status ${response.status}`,
          });

          const failLog: SystemLog = {
            id: generateId("log"),
            timestamp: new Date().toISOString(),
            event_type: "WEBHOOK_FAILED",
            source: "testing-studio",
            severity: "high",
            message: `Webhook failed with status ${response.status}`,
            trace_id: merchantId,
          };
          addLog(failLog);

          await fetch(`${API_BASE_URL}/api/logs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(failLog),
          });
        }
      } catch (error) {
        toast.error(`Error: ${card.title}`, {
          description: error instanceof Error ? error.message : "Unknown error",
        });

        const errorLog: SystemLog = {
          id: generateId("log"),
          timestamp: new Date().toISOString(),
          event_type: "WEBHOOK_ERROR",
          source: "testing-studio",
          severity: "critical",
          message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
          trace_id: merchantId,
        };
        addLog(errorLog);

        await fetch(`${API_BASE_URL}/api/logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(errorLog),
        });
      } finally {
        setLoadingTests((prev) => ({ ...prev, [card.id]: false }));
      }
    },
    [addLog]
  );

  const clearLogs = useCallback(async () => {
    setLogs([]);
    try {
      await fetch(`${API_BASE_URL}/api/logs`, { method: "DELETE" });
      toast.success("Logs cleared");
    } catch (error) {
      console.error("Failed to clear logs:", error);
    }
  }, []);

  return (
    <div className="flex h-full">
      {/* logs panel */}
      <div className="flex flex-1 flex-col">
        {/* header */}
        <div className="bg-background/95 supports-backdrop-filter:bg-background/60 shrink-0 border-b backdrop-blur">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 md:gap-3">
                <div className="bg-muted hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:flex">
                  <Terminal className="text-muted-foreground h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold md:text-xl">
                    Testing Studio
                  </h1>
                  <p className="text-muted-foreground hidden text-sm sm:block">
                    Trigger signals to test the self-healing agent
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isLive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsLive(!isLive)}
                  className={cn(
                    "gap-2",
                    isLive && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {isLive ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                      </span>
                      Live
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      Resume
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={clearLogs}>
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* logs table header */}
        <div className="text-muted-foreground flex items-center gap-2 border-b px-4 py-2 font-mono text-xs tracking-wide uppercase">
          <span className="w-32">Timestamp</span>
          <span className="w-44">Event</span>
          <span className="flex-1">Details</span>
        </div>

        {/* logs list */}
        <ScrollArea className="flex-1">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Terminal className="text-muted-foreground h-12 w-12" />
              <p className="text-muted-foreground mt-4">No logs yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Trigger a test to see logs appear here
              </p>
            </div>
          ) : (
            <div>
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    "group hover:bg-muted/50 flex items-start gap-4 border-b px-4 py-2 font-mono text-sm transition-colors",
                    newLogIds.has(log.id) && "bg-primary/5"
                  )}
                >
                  <span className="text-muted-foreground w-32 shrink-0 text-xs">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span
                    className={cn(
                      "w-44 shrink-0 text-xs font-medium uppercase",
                      SEVERITY_COLORS[log.severity] || "text-muted-foreground"
                    )}
                  >
                    {log.event_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-foreground min-w-0 flex-1 text-xs">
                    <span className="text-cyan-600 dark:text-cyan-400">
                      [{log.source}]
                    </span>{" "}
                    <span className="text-muted-foreground">{log.message}</span>
                    {log.trace_id && (
                      <span className="text-muted-foreground ml-2 opacity-60">
                        id={log.trace_id.slice(-8)}
                      </span>
                    )}
                  </span>
                </div>
              ))}
              {/* infinite scroll loader */}
              <div ref={loaderRef} className="py-4 flex justify-center">
                {isLoadingMore && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* footer */}
        <div className="bg-muted/50 flex items-center justify-between border-t px-4 py-2">
          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              {logs.length} logs
            </span>
            {isLive && (
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-600 dark:bg-green-500" />
                Monitoring active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* test cards panel */}
      <div className="hidden w-80 border-l lg:block">
        <div className="bg-background/95 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-semibold">Signal Triggers</h2>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Send test signals to the agent
          </p>
        </div>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="space-y-3 p-3">
            {TEST_CARDS.map((card) => (
              <div
                key={card.id}
                className="rounded-lg border border-border bg-card p-3"
              >
                {/* card header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    {card.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium leading-tight">
                      {card.title}
                    </h3>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {card.description}
                    </p>
                  </div>
                </div>

                {/* metadata */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium uppercase">
                    {card.severity}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {card.errorCode}
                  </span>
                </div>

                {/* test button */}
                <button
                  onClick={() => triggerTest(card)}
                  disabled={loadingTests[card.id]}
                  className={cn(
                    "w-full h-8 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 border border-border",
                    "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                    loadingTests[card.id] && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loadingTests[card.id] ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Trigger"
                  )}
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
