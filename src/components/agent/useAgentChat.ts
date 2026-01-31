"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import type { ChatMessage, ActionCard, AgentResponse } from "./types";
import { getUser } from "~/hooks/useUser";
import { config } from "~/lib/config";

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
  }, [messages, isLoading]);

  // send message to agent via express backend
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

    try {
      // build payload
      const payload = {
        _id: currentTicketId,
        merchant_id: user.id,
        message: {
          content: userMessage.content,
        },
      };

      // send to express backend
      const response = await fetch(config.api.agent, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      // extract data from api response wrapper
      const data: AgentResponse & { success?: boolean; error?: string; tools_used?: string[] } =
        responseData.data || responseData;

      // store ticket id for subsequent messages
      if (data.ticket_id && !currentTicketId) {
        setCurrentTicketId(data.ticket_id);
      }

      const assistantMessage: ChatMessage = {
        id: generateId("msg"),
        role: "assistant",
        content: data.agent_message,
        timestamp: Date.now(),
        cards: data.cards || [],
        ticketId: data.ticket_id,
        toolsUsed: data.tools_used || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

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

      // TODO: implement actual action execution via express backend
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
    setCurrentTicketId(null);
  }, []);

  // load existing ticket conversation
  const loadTicketConversation = useCallback(
    (ticketId: string, chatHistory: Array<{ role: "user" | "assistant"; content: string; timestamp: string; cards?: ActionCard[]; tools_used?: string[] }>) => {
      const loadedMessages: ChatMessage[] = chatHistory.map((item, index) => ({
        id: `loaded-${ticketId}-${index}`,
        role: item.role,
        content: item.content,
        timestamp: new Date(item.timestamp).getTime(),
        cards: item.cards,
        ticketId: item.role === "assistant" ? ticketId : undefined,
        toolsUsed: item.tools_used,
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
    scrollRef,
    currentTicketId,
    sendMessage,
    handleActionClick,
    startNewConversation,
    loadTicketConversation,
  };
}
