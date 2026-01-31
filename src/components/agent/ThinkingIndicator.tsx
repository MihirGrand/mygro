"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { ShimmeringText } from "~/components/ui/shimmering-text";

export const ThinkingIndicator = memo(function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className=" flex w-full items-center gap-2 rounded-t-lg px-3 py-2 text-left transition-colors"
    >
      <div className="bg-muted mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
        <Lightbulb className="text-muted-foreground h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 pt-1.5">
        <ShimmeringText
          text="Thinking..."
          duration={1.5}
          repeatDelay={0.3}
          className="text-sm"
        />
      </div>
    </motion.div>
  );
});
