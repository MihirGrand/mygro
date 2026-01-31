"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "~/lib/utils";

interface ToolsUsedProps {
  tools: string[];
}

// formats tool name for display
function formatToolName(tool: string): string {
  const toolLabels: Record<string, string> = {
    docs: "Docs",
    previous_chats: "Previous Chats",
    search: "Search",
    database: "Database",
    api: "API",
    code: "Code",
    knowledge_base: "Knowledge Base",
    chat_history: "Chat History",
  };

  const normalized = tool.toLowerCase().replace(/[-\s]/g, "_");
  return (
    toolLabels[normalized] ||
    tool
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

const ToolItem = memo(function ToolItem({
  tool,
  index,
}: {
  tool: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.2 }}
      className="flex items-center gap-1.5"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.1 + 0.1, duration: 0.15 }}
        className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/10"
      >
        <Check className="h-2.5 w-2.5 text-emerald-500" />
      </motion.div>
      <span className="text-xs text-muted-foreground">{formatToolName(tool)}</span>
    </motion.div>
  );
});

export const ToolsUsed = memo(function ToolsUsed({ tools }: ToolsUsedProps) {
  if (!tools || tools.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-3 flex flex-wrap items-center gap-3"
    >
      {tools.map((tool, index) => (
        <ToolItem key={`${tool}-${index}`} tool={tool} index={index} />
      ))}
    </motion.div>
  );
});
