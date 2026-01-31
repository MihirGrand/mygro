"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import type { ReasoningStep } from "./types";

// status icon component
export const StatusIcon = memo(function StatusIcon({
  status,
}: {
  status: "pending" | "active" | "complete" | "error";
}) {
  switch (status) {
    case "pending":
      return (
        <div className="border-muted-foreground/30 h-3.5 w-3.5 rounded-full border-2" />
      );
    case "active":
      return <Loader2 className="text-foreground h-3.5 w-3.5 animate-spin" />;
    case "complete":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    case "error":
      return <AlertCircle className="text-destructive h-3.5 w-3.5" />;
  }
});

// thinking indicator with reasoning steps
export const ThinkingIndicator = memo(function ThinkingIndicator({
  steps,
}: {
  steps: ReasoningStep[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-3"
    >
      <div className="bg-muted mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
        <Loader2 className="text-foreground h-3.5 w-3.5 animate-spin" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 pt-1">
          <span className="text-foreground text-sm font-medium">
            Processing...
          </span>
        </div>

        {steps.length > 0 && (
          <div className="border-border/50 bg-muted/30 mt-3 rounded-lg border px-3 py-2">
            <div className="flex flex-col gap-1">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.2 }}
                  className="text-muted-foreground flex items-center gap-2 text-xs"
                >
                  <StatusIcon status={step.status} />
                  <span
                    className={cn(
                      step.status === "active" && "text-foreground",
                      step.status === "error" && "text-destructive",
                    )}
                  >
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});
