"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { StatusIcon } from "./ThinkingIndicator";
import type { ReasoningStep } from "./types";

// inline chain of thought for completed messages
export const InlineChainOfThought = memo(function InlineChainOfThought({
  steps,
}: {
  steps: ReasoningStep[];
}) {
  if (steps.length === 0) return null;

  return (
    <div className="border-border/50 bg-muted/20 mt-2 rounded-lg border px-3 py-2 dark:bg-zinc-900/50">
      <div className="flex flex-col gap-0.5">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.15 }}
            className="text-muted-foreground flex items-center gap-2 text-xs"
          >
            <StatusIcon status={step.status} />
            <span>{step.label}</span>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: steps.length * 0.05 }}
          className="border-border/30 mt-1.5 flex items-center gap-1.5 border-t pt-1.5 text-xs text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span>Done</span>
        </motion.div>
      </div>
    </div>
  );
});
