"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { MessageCircle, Plus } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { useAgentChat } from "./useAgentChat";
import type { TicketHistoryItem } from "./types";

interface AgentPanelProps {
  selectedTicketId?: string | null;
  ticketChatHistory?: TicketHistoryItem[];
  onTicketCreated?: (ticketId: string) => void;
}

export function AgentPanel({
  selectedTicketId,
  ticketChatHistory,
  onTicketCreated,
}: AgentPanelProps) {
  const {
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
  } = useAgentChat();

  // load ticket conversation when selected ticket changes
  useEffect(() => {
    if (selectedTicketId && ticketChatHistory) {
      loadTicketConversation(selectedTicketId, ticketChatHistory);
    }
  }, [selectedTicketId, ticketChatHistory, loadTicketConversation]);

  // notify parent when new ticket is created
  useEffect(() => {
    if (currentTicketId && onTicketCreated && !selectedTicketId) {
      onTicketCreated(currentTicketId);
    }
  }, [currentTicketId, onTicketCreated, selectedTicketId]);

  return (
    <div className="bg-background flex h-full w-full flex-col">
      {/* header */}
      <div className="border-border/40 flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
            <MessageCircle className="text-foreground h-4 w-4" />
          </div>
          <div>
            <h1 className="text-foreground text-sm font-medium">Support</h1>
            <p className="text-muted-foreground text-xs">
              {currentTicketId ? currentTicketId : "New conversation"}
            </p>
          </div>
        </div>

        {currentTicketId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={startNewConversation}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        )}
      </div>

      {/* chat area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="flex flex-col gap-4 p-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onAction={handleActionClick}
            />
          ))}

          <AnimatePresence mode="wait">
            {isLoading && <ThinkingIndicator key="thinking" />}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* input */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
