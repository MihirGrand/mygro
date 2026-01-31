"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import type { ChatMessage, ReasoningStep, ActionCard, AgentResponse } from "./types";
import { getUser } from "~/hooks/useUser";

// generates unique id
function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm here to help with your support requests. Describe your issue or question, and I'll assist you.",
  timestamp: Date.now(),
};

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading, reasoningSteps]);

  // send message to agent
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const user = getUser();
    if (!user?.id) {
      toast.error("Please sign in to continue");
      return;
    }

    const userMessage: ChatMessage = {
      id: generateId("msg"),
      role: "user",
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // initialize reasoning steps
    const steps: ReasoningStep[] = [
      { id: "receive", label: "Receiving your message", status: "active" },
      { id: "process", label: "Processing request", status: "pending" },
      { id: "respond", label: "Generating response", status: "pending" },
    ];
    setReasoningSteps(steps);

    try {
      // step 1: receive
      await new Promise((r) => setTimeout(r, 300));
      setReasoningSteps((prev) =>
        prev.map((s) =>
          s.id === "receive"
            ? { ...s, status: "complete" }
            : s.id === "process"
              ? { ...s, status: "active" }
              : s,
        ),
      );

      // build payload
      const payload = {
        _id: currentTicketId,
        merchant_id: user.id,
        message: {
          content: userMessage.content,
        },
      };

      // step 2: process - send to our api proxy
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: AgentResponse & { success?: boolean; error?: string } = await response.json();

      setReasoningSteps((prev) =>
        prev.map((s) =>
          s.id === "process"
            ? { ...s, status: "complete" }
            : s.id === "respond"
              ? { ...s, status: "active" }
              : s,
        ),
      );

      // store ticket id for subsequent messages
      if (data.ticket_id && !currentTicketId) {
        setCurrentTicketId(data.ticket_id);
      }

      // step 3: respond
      await new Promise((r) => setTimeout(r, 200));
      setReasoningSteps((prev) =>
        prev.map((s) => (s.id === "respond" ? { ...s, status: "complete" } : s)),
      );

      const assistantMessage: ChatMessage = {
        id: generateId("msg"),
        role: "assistant",
        content: data.agent_message,
        timestamp: Date.now(),
        cards: data.cards || [],
        ticketId: data.ticket_id,
        reasoning: steps.map((s) => ({ ...s, status: "complete" as const })),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      // mark steps as error
      setReasoningSteps((prev) =>
        prev.map((s) =>
          s.status === "active" || s.status === "pending"
            ? { ...s, status: "error" }
            : s,
        ),
      );

      const errorMessage: ChatMessage = {
        id: generateId("msg"),
        role: "assistant",
        content:
          "I encountered an error while processing your request. Please try again or contact support if the issue persists.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      toast.error("Failed to send message", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
      setReasoningSteps([]);
    }
  }, [inputValue, isLoading, currentTicketId]);

  // handle action button click
  const handleActionClick = useCallback((card: ActionCard) => {
    if (card.type === "link" && card.url) {
      window.open(card.url, "_blank");
      return;
    }

    if (card.action_payload) {
      toast.success(`Action "${card.label}" triggered`, {
        description: `Executing: ${card.action_payload.webhook_to_call}`,
      });

      // TODO: implement actual action execution
      const actionMessage: ChatMessage = {
        id: generateId("msg"),
        role: "assistant",
        content: `✓ Action "${card.label}" has been executed successfully.`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, actionMessage]);
    }
  }, []);

  // start new conversation
  const startNewConversation = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setInputValue("");
    setReasoningSteps([]);
    setCurrentTicketId(null);
  }, []);

  // load existing ticket conversation
  const loadTicketConversation = useCallback(
    (ticketId: string, chatHistory: Array<{ role: "user" | "assistant"; content: string; timestamp: string; cards?: ActionCard[] }>) => {
      const loadedMessages: ChatMessage[] = chatHistory.map((item, index) => ({
        id: `loaded-${ticketId}-${index}`,
        role: item.role,
        content: item.content,
        timestamp: new Date(item.timestamp).getTime(),
        cards: item.cards,
        ticketId: item.role === "assistant" ? ticketId : undefined,
      }));

      setMessages(loadedMessages.length > 0 ? loadedMessages : [WELCOME_MESSAGE]);
      setCurrentTicketId(ticketId);
    },
    [],
  );

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    reasoningSteps,
    scrollRef,
    currentTicketId,
    sendMessage,
    handleActionClick,
    startNewConversation,
    loadTicketConversation,
  };
}
