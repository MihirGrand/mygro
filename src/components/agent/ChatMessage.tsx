"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { ToolsUsed } from "./ToolsUsed";
import { ActionCards } from "./ActionCards";
import { MessageActions } from "./MessageActions";
import { MarkdownContent } from "./MarkdownContent";
import { formatTime } from "./utils";
import type { ChatMessage as ChatMessageType, ActionCard } from "./types";

interface ChatMessageProps {
  message: ChatMessageType;
  onAction: (card: ActionCard) => void;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  onAction,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] min-w-0 flex-col",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "relative max-w-full",
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5"
              : "text-foreground",
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <MarkdownContent content={message.content} />
          )}

          {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
            <ToolsUsed tools={message.toolsUsed} />
          )}

          {!isUser && message.cards && message.cards.length > 0 && (
            <ActionCards cards={message.cards} onAction={onAction} />
          )}
        </div>

        <div
          className={cn(
            "mt-1.5 flex items-center gap-2",
            isUser ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="text-muted-foreground/50 text-[10px]">
            {formatTime(message.timestamp)}
          </span>

          {!isUser && <MessageActions content={message.content} />}
        </div>
      </div>
    </motion.div>
  );
});
