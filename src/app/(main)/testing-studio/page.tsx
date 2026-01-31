"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Activity,
  Terminal,
  RefreshCw,
  Play,
  AlertTriangle,
  Clock,
  Key,
  Shield,
  Zap,
  Server,
  Database,
  Wifi,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { toast } from "sonner";

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
  errorCode: string;
  endpoint: string;
  defaultValue: string;
  correctValue: string;
  inputLabel: string;
  inputPlaceholder: string;
  eventType: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const WEBHOOK_URL =
  "https://abstruse.app.n8n.cloud/webhook-test/system-signal";

// test cards configuration
const TEST_CARDS: TestCard[] = [
  {
    id: "api-token",
    title: "API Token Mismatch",
    description: "Invalid API key auth",
    icon: <Key className="h-4 w-4" />,
    errorCode: "AUTH_401",
    endpoint: "GET /v2/products",
    defaultValue: "sk_test_invalid_token",
    correctValue: "sk_live_valid_token",
    inputLabel: "API Token",
    inputPlaceholder: "Enter API token",
    eventType: "auth_failure",
  },
  {
    id: "cors",
    title: "CORS Error",
    description: "Cross-origin failure",
    icon: <Shield className="h-4 w-4" />,
    errorCode: "CORS_403",
    endpoint: "OPTIONS /v2/checkout",
    defaultValue: "http://malicious-site.com",
    correctValue: "https://shop.merchant.com",
    inputLabel: "Origin",
    inputPlaceholder: "Enter origin URL",
    eventType: "cors_violation",
  },
  {
    id: "rate-limit",
    title: "Rate Limit Error",
    description: "API rate limiting (429)",
    icon: <Zap className="h-4 w-4" />,
    errorCode: "RATE_429",
    endpoint: "POST /v2/orders/bulk",
    defaultValue: "1500",
    correctValue: "100",
    inputLabel: "Requests/min",
    inputPlaceholder: "Enter request count",
    eventType: "rate_limit_exceeded",
  },
  {
    id: "webhook-fail",
    title: "Webhook Failure",
    description: "Failed webhook delivery",
    icon: <Wifi className="h-4 w-4" />,
    errorCode: "WEBHOOK_FAIL",
    endpoint: "POST /webhooks/order-created",
    defaultValue: "https://invalid-endpoint.local",
    correctValue: "https://merchant.com/webhooks",
    inputLabel: "Webhook URL",
    inputPlaceholder: "Enter webhook URL",
    eventType: "webhook_failure",
  },
  {
    id: "timeout",
    title: "API Timeout",
    description: "Slow API response",
    icon: <Clock className="h-4 w-4" />,
    errorCode: "TIMEOUT_504",
    endpoint: "GET /v2/inventory/sync",
    defaultValue: "30000",
    correctValue: "5000",
    inputLabel: "Timeout (ms)",
    inputPlaceholder: "Enter timeout in ms",
    eventType: "api_timeout",
  },
  {
    id: "db-error",
    title: "Database Error",
    description: "DB connection failure",
    icon: <Database className="h-4 w-4" />,
    errorCode: "DB_500",
    endpoint: "POST /v2/products/create",
    defaultValue: "invalid-connection-string",
    correctValue: "postgresql://localhost:5432",
    inputLabel: "DB Connection",
    inputPlaceholder: "Enter connection string",
    eventType: "database_error",
  },
  {
    id: "ssl-error",
    title: "SSL Certificate Error",
    description: "Invalid SSL cert",
    icon: <Shield className="h-4 w-4" />,
    errorCode: "SSL_ERR",
    endpoint: "POST /v2/payments/process",
    defaultValue: "expired-cert",
    correctValue: "valid-cert",
    inputLabel: "Certificate",
    inputPlaceholder: "Enter cert status",
    eventType: "ssl_error",
  },
  {
    id: "payload-error",
    title: "Invalid JSON Payload",
    description: "Malformed request body",
    icon: <Server className="h-4 w-4" />,
    errorCode: "PARSE_400",
    endpoint: "POST /v2/checkout/create",
    defaultValue: '{"items": [invalid]}',
    correctValue: '{"items": []}',
    inputLabel: "Payload",
    inputPlaceholder: "Enter JSON payload",
    eventType: "payload_error",
  },
];

const SEVERITY_COLORS = {
  low: "text-slate-500",
  medium: "text-yellow-500",
  high: "text-orange-500",
  critical: "text-red-500",
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
  const [testInputs, setTestInputs] = useState<Record<string, string>>({});
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
      const inputValue = testInputs[card.id] || card.defaultValue;
      const isError = inputValue !== card.correctValue;

      setLoadingTests((prev) => ({ ...prev, [card.id]: true }));

      const timestamp = new Date().toISOString();
      const merchantId = `MERCH-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`;

      // webhook payload
      const webhookPayload = {
        event_type: card.eventType,
        severity: isError ? "medium" : "low",
        timestamp,
        merchant_id: merchantId,
        email: "merchant@example.com",
        service_source: "api_gateway",
        error_code: isError ? card.errorCode : "SUCCESS",
        payload: {
          description: isError
            ? `${card.title}. Expected "${card.correctValue}" but received "${inputValue}".`
            : `Test passed for ${card.title}`,
          endpoint: card.endpoint,
          client_ip: "192.168.1." + Math.floor(Math.random() * 255),
          test_input: inputValue,
          expected_value: card.correctValue,
        },
      };

      // local log
      const logEntry: SystemLog = {
        id: generateId("log"),
        timestamp,
        event_type: isError ? card.errorCode : "TEST_SUCCESS",
        source: card.title,
        severity: isError ? "medium" : "low",
        message: isError
          ? `${card.errorCode}: Expected "${card.correctValue}" but got "${inputValue}"`
          : `Test passed: ${card.title}`,
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

      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
        });

        if (response.ok) {
          toast.success("Webhook sent");
          const successLog: SystemLog = {
            id: generateId("log"),
            timestamp: new Date().toISOString(),
            event_type: "WEBHOOK_DELIVERED",
            source: "webhook-service",
            severity: "low",
            message: `Webhook delivered - Merchant: ${merchantId}`,
            trace_id: merchantId,
          };
          addLog(successLog);
          await fetch(`${API_BASE_URL}/api/logs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(successLog),
          });
        } else {
          toast.error("Webhook failed");
          const failLog: SystemLog = {
            id: generateId("log"),
            timestamp: new Date().toISOString(),
            event_type: "WEBHOOK_FAILED",
            source: "webhook-service",
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
        toast.error("Failed to send webhook");
        const errorLog: SystemLog = {
          id: generateId("log"),
          timestamp: new Date().toISOString(),
          event_type: "WEBHOOK_ERROR",
          source: "webhook-service",
          severity: "critical",
          message: `Webhook error: ${error instanceof Error ? error.message : "Unknown error"}`,
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
    [testInputs, addLog]
  );

  const clearLogs = useCallback(async () => {
    setLogs([]);
    try {
      await fetch(`${API_BASE_URL}/api/logs`, { method: "DELETE" });
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
                    Simulate errors and monitor system signals
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
                      SEVERITY_COLORS[log.severity]
                    )}
                  >
                    {log.event_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-foreground min-w-0 flex-1 text-xs">
                    <span className="text-cyan-600 dark:text-cyan-400">
                      [{log.source}]
                    </span>{" "}
                    <span className="text-muted-foreground">{log.message}</span>
                    <span className="text-muted-foreground ml-2 opacity-60">
                      merchant={log.trace_id}
                    </span>
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
        <div className="bg-background/95 border-b px-3 py-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-primary h-4 w-4" />
            <h2 className="text-sm font-semibold">Error Simulators</h2>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Test the self-healing agent
          </p>
        </div>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="space-y-2 p-2">
            {TEST_CARDS.map((card) => {
              const isError =
                (testInputs[card.id] ?? card.defaultValue) !== card.correctValue;
              return (
                <div
                  key={card.id}
                  className="rounded-lg border border-border/50 bg-card p-2.5"
                >
                  {/* card header */}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                      <span className="text-muted-foreground">{card.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-medium leading-tight">
                        {card.title}
                      </h3>
                      <p className="text-muted-foreground text-[10px] mt-0.5">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {/* correct value hint */}
                  <div className="text-[10px] text-muted-foreground mb-1.5">
                    Expected:{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-[10px]">
                      {card.correctValue.length > 20
                        ? card.correctValue.slice(0, 20) + "..."
                        : card.correctValue}
                    </code>
                  </div>

                  {/* input */}
                  <Input
                    id={card.id}
                    placeholder={card.inputPlaceholder}
                    value={testInputs[card.id] ?? card.defaultValue}
                    onChange={(e) =>
                      setTestInputs((prev) => ({
                        ...prev,
                        [card.id]: e.target.value,
                      }))
                    }
                    className="h-7 text-xs font-mono mb-2"
                  />

                  {/* test button */}
                  <button
                    onClick={() => triggerTest(card)}
                    disabled={loadingTests[card.id]}
                    className={cn(
                      "w-full h-7 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
                      isError
                        ? "bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                        : "bg-primary/10 text-emerald-400 hover:bg-primary/20",
                      loadingTests[card.id] && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {loadingTests[card.id] ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
