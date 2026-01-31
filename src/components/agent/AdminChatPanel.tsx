"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageCircle,
  Send,
  Loader2,
  CheckCircle2,
  UserCircle,
  RotateCcw,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { MarkdownContent } from "./MarkdownContent";
import { toast } from "sonner";
import {
  fetchTicketMessagesAdmin,
  sendAdminMessage,
  resolveTicketAdmin,
} from "~/lib/api/tickets";
import type { Ticket, TicketHistoryItem } from "~/lib/api/tickets";

const GEMINI_API_KEY = "AIzaSyCsg9Kzzic1w62Ojq7mKUqduXYbq0NGRY8";

// format time for message
function formatTime(timestamp: string | number): string {
  const time =
    typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
  return new Date(time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// chat message component
function ChatBubble({ message }: { message: TicketHistoryItem }) {
  const isUser = message.role === "user";
  const isHuman = message.is_human;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex w-full gap-3",
        isUser ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] min-w-0 flex-col",
          isUser ? "items-start" : "items-end"
        )}
      >
        {/* sender badge */}
        {!isUser && (
          <div className="mb-1 flex items-center gap-1">
            <UserCircle className="h-3 w-3 text-primary" />
            <span className="text-[10px] text-primary font-medium">
              {isHuman ? "you" : "ai"}
            </span>
          </div>
        )}

        <div
          className={cn(
            "relative max-w-full rounded-2xl px-4 py-2.5",
            isUser
              ? "bg-muted text-foreground rounded-bl-md"
              : isHuman
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-emerald-500/10 text-foreground rounded-br-md border border-emerald-500/20"
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-muted-foreground/50 text-[10px]">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// quick action button
function QuickActionButton({
  label,
  onClick,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  icon?: React.ElementType;
  variant?: "default" | "primary";
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-auto py-2 px-3 text-xs whitespace-normal text-left justify-start gap-2",
        variant === "primary" &&
          "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{label}</span>
    </Button>
  );
}

// generate suggestions using gemini
async function generateSuggestions(
  messages: TicketHistoryItem[]
): Promise<string[]> {
  if (messages.length === 0) return [];

  const chatContext = messages
    .slice(-10)
    .map((m) => `${m.role === "user" ? "Customer" : "Support"}: ${m.content}`)
    .join("\n");

  const prompt = `You are a customer support assistant. Based on the following conversation, suggest 3 brief follow-up responses that a human support agent could send. Each suggestion should be helpful, professional, and actionable. Keep each suggestion under 100 characters.

Conversation:
${chatContext}

Return ONLY a JSON array of 3 strings, no other text. Example format:
["suggestion 1", "suggestion 2", "suggestion 3"]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Gemini API error");
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // extract json array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      if (Array.isArray(suggestions)) {
        return suggestions.slice(0, 3);
      }
    }

    return [];
  } catch (error) {
    console.error("Failed to generate suggestions:", error);
    return [];
  }
}

interface AdminChatPanelProps {
  selectedTicket?: Ticket | null;
  onTicketUpdated?: () => void;
}

export function AdminChatPanel({
  selectedTicket,
  onTicketUpdated,
}: AdminChatPanelProps) {
  const [messages, setMessages] = useState<TicketHistoryItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // load messages when ticket changes
  useEffect(() => {
    if (selectedTicket) {
      setMessages(selectedTicket.chat_history || []);
      setSuggestions([]);
    } else {
      setMessages([]);
      setSuggestions([]);
    }
  }, [selectedTicket]);

  // scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // polling for new messages
  useEffect(() => {
    if (selectedTicket && selectedTicket.is_escalated && selectedTicket.status !== "resolved") {
      const poll = async () => {
        try {
          const newMessages = await fetchTicketMessagesAdmin(selectedTicket._id);
          setMessages(newMessages);
        } catch (error) {
          console.error("Polling error:", error);
        }
      };

      pollingRef.current = setInterval(poll, 2000);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [selectedTicket]);

  const handleSendMessage = useCallback(
    async (content?: string) => {
      const messageContent = content || inputValue.trim();
      if (!messageContent || !selectedTicket || isSending) return;

      setIsSending(true);
      setInputValue("");
      setSuggestions([]);

      // optimistic update
      const optimisticMessage: TicketHistoryItem = {
        role: "assistant",
        content: messageContent,
        timestamp: new Date().toISOString(),
        is_human: true,
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        await sendAdminMessage(selectedTicket._id, messageContent);
        onTicketUpdated?.();
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
        setMessages((prev) => prev.slice(0, -1));
        setInputValue(messageContent);
      } finally {
        setIsSending(false);
      }
    },
    [inputValue, selectedTicket, isSending, onTicketUpdated]
  );

  const handleResolve = useCallback(async () => {
    if (!selectedTicket || isResolving) return;

    setIsResolving(true);

    // optimistic update - add resolution message immediately
    const resolutionMessage: TicketHistoryItem = {
      role: "assistant",
      content: "This ticket has been marked as resolved by the support agent. If you need further assistance, please feel free to start a new conversation.",
      timestamp: new Date().toISOString(),
      is_human: true,
    };
    setMessages((prev) => [...prev, resolutionMessage]);

    try {
      await resolveTicketAdmin(selectedTicket._id);
      toast.success("Ticket resolved");
      onTicketUpdated?.();
    } catch (error) {
      console.error("Failed to resolve ticket:", error);
      toast.error("Failed to resolve ticket");
      // revert optimistic update
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsResolving(false);
    }
  }, [selectedTicket, isResolving, onTicketUpdated]);

  const handleReopen = useCallback(async () => {
    if (!selectedTicket || isReopening) return;

    setIsReopening(true);

    const reopenMessage = "I'm reopening this ticket to provide further assistance. How can I help you?";

    // optimistic update - add reopen message immediately
    const optimisticMessage: TicketHistoryItem = {
      role: "assistant",
      content: reopenMessage,
      timestamp: new Date().toISOString(),
      is_human: true,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      await sendAdminMessage(selectedTicket._id, reopenMessage);
      toast.success("Ticket reopened");
      onTicketUpdated?.();
    } catch (error) {
      console.error("Failed to reopen ticket:", error);
      toast.error("Failed to reopen ticket");
      // revert optimistic update
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsReopening(false);
    }
  }, [selectedTicket, isReopening, onTicketUpdated]);

  const handleGenerateSuggestions = useCallback(async () => {
    if (messages.length === 0 || isLoadingSuggestions) return;

    setIsLoadingSuggestions(true);
    try {
      const newSuggestions = await generateSuggestions(messages);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      toast.error("Failed to generate suggestions");
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [messages, isLoadingSuggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (text: string) => {
    setInputValue(text);
  };

  const isResolved = selectedTicket?.status === "resolved";

  // empty state when no ticket selected
  if (!selectedTicket) {
    return (
      <div className="bg-background flex h-full w-full flex-col">
        <div className="border-border/40 flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
              <MessageCircle className="text-foreground h-4 w-4" />
            </div>
            <div>
              <h1 className="text-foreground text-sm font-medium">Chat</h1>
              <p className="text-muted-foreground text-xs">Select a ticket</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="bg-muted/50 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
              <MessageCircle className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              Select a ticket to view conversation
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-full w-full flex-col">
      {/* header */}
      <div className="border-border/40 flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <UserCircle className="text-primary h-4 w-4" />
          </div>
          <div>
            <h1 className="text-foreground text-sm font-medium">
              {selectedTicket.ticket_id}
            </h1>
            <p className="text-muted-foreground text-xs">
              {selectedTicket.merchant?.name || "User"}
            </p>
          </div>
        </div>

        {selectedTicket.is_escalated && !isResolved && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResolve}
            disabled={isResolving}
            className="gap-1.5 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
          >
            {isResolving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Resolve
          </Button>
        )}
      </div>

      {/* user info banner */}
      {selectedTicket.merchant && (
        <div className="bg-muted/30 border-border/40 border-b px-4 py-2">
          <p className="text-muted-foreground text-xs">
            Chatting with{" "}
            <span className="text-foreground font-medium">
              {selectedTicket.merchant.name}
            </span>{" "}
            ({selectedTicket.merchant.email})
          </p>
        </div>
      )}

      {/* resolved banner */}
      {isResolved && (
        <div className="bg-emerald-500/10 border-emerald-500/20 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600 text-sm font-medium">
                This ticket has been resolved
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReopen}
              disabled={isReopening}
              className="gap-1.5 h-7 text-xs"
            >
              {isReopening ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              Reopen
            </Button>
          </div>
        </div>
      )}

      {/* chat area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="flex flex-col gap-4 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground text-sm">No messages yet</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <ChatBubble
                  key={`${message.timestamp}-${index}`}
                  message={message}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {/* quick actions and suggestions */}
      {!isResolved && selectedTicket.is_escalated && (
        <div className="border-border/40 border-t px-3 py-2">
          <div className="flex flex-wrap gap-2">
            {/* default quick actions */}
            <QuickActionButton
              label="Allow me some time to review your case"
              icon={Clock}
              onClick={() =>
                handleQuickAction(
                  "Thank you for your patience. Allow me some time to go through your conversation history and I'll get back to you with a solution shortly."
                )
              }
            />

            {/* generate suggestions button */}
            <QuickActionButton
              label={
                isLoadingSuggestions ? "Analyzing..." : "Suggest responses"
              }
              icon={isLoadingSuggestions ? RefreshCw : Sparkles}
              variant="primary"
              onClick={handleGenerateSuggestions}
            />
          </div>

          {/* ai suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                Suggested responses
              </p>
              <div className="flex flex-col gap-1.5">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleQuickAction(suggestion)}
                    className="text-left text-xs p-2 rounded-lg bg-primary/5 border border-primary/20 text-foreground hover:bg-primary/10 transition-colors"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* input */}
      {!isResolved && (
        <div className="border-border/40 bg-background border-t p-3">
          <div
            className={cn(
              "bg-input/20 flex flex-col rounded-xl",
              "ring-1 ring-transparent transition-all duration-200"
            )}
          >
            <div className="px-3 py-3">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                disabled={isSending}
                rows={1}
                className={cn(
                  "w-full resize-none border-none text-sm leading-relaxed shadow-none focus-visible:ring-0",
                  "placeholder:text-muted-foreground/60",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                style={{ minHeight: "24px", maxHeight: "120px" }}
              />
            </div>

            <div className="flex items-center justify-end px-2 pb-2">
              {isSending ? (
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 transition-colors",
                    inputValue.trim()
                      ? "text-foreground hover:bg-muted"
                      : "text-muted-foreground/50"
                  )}
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
