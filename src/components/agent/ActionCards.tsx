"use client";

import { memo } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import type { ActionCard } from "./types";

interface ActionCardsProps {
  cards: ActionCard[];
  onAction: (card: ActionCard) => void;
}

// action cards renderer
export const ActionCards = memo(function ActionCards({
  cards,
  onAction,
}: ActionCardsProps) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {cards.map((card) => {
        if (card.type === "link" && card.url) {
          return (
            <Button
              key={card.id}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              asChild
            >
              <a href={card.url} target="_blank" rel="noopener noreferrer">
                {card.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          );
        }

        return (
          <Button
            key={card.id}
            variant={card.style === "primary" ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 text-xs",
              card.style === "destructive" &&
                "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground",
            )}
            onClick={() => onAction(card)}
          >
            {card.label}
          </Button>
        );
      })}
    </div>
  );
});
