"use client";
import {
  Message, MessageContent,
  MessageResponse,
} from "~/components/aiAgent/Message";
import { Shimmer } from "~/components/aiAgent/shimmer";
import { Card } from "~/components/ui/card";
import useUser from "~/hooks/useUser";
import { Ticket, Bot, MessageSquare, Clock } from "lucide-react";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "~/components/aiAgent/ChainofThoughts";

export default function MyTicketsPage() {
  const { user } = useUser();
  const messages = [
    {
      id: 1,
      role: "user",
      content: "Hi, we will win this hackathon.",
    },
    {
      id: 2,
      role: "assistant",
      content: `Hell yea.`,
    },
  ];

  return (
    <div className="flex h-full">
      {/* main content */}
      <div className="flex-1 p-6">

      </div>

      {/* agent panel */}
      {/* agent panel */}
      <div className="hidden w-[28rem] border-l lg:block">
        <div className="flex h-full flex-col">

          {/* header */}
          <div className="border-b p-4">
            <h2 className="font-semibold">Agent</h2>
          </div>

          {/* chat messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((msg) => (
              <Message from={msg.role as "user" | "assistant"}>
                <MessageContent>
                  <MessageResponse>
                    {msg.content}
                  </MessageResponse>
                </MessageContent>
              </Message>
            ))}
          </div>

          {/* agent reasoning */}
          <div className="border-t p-4">
            <ChainOfThought defaultOpen>
              <ChainOfThoughtHeader title="Agent reasoning" />
              <ChainOfThoughtContent>
                <ChainOfThoughtStep
                  label="Observing incoming tickets"
                  status="complete"
                />
                <ChainOfThoughtStep
                  label="Detecting pattern across merchants"
                  status="complete"
                >
                  <p className="text-muted-foreground text-xs">
                    12 merchants share missing webhook configuration
                  </p>
                </ChainOfThoughtStep>
                <ChainOfThoughtStep
                  label="Forming root-cause hypothesis"
                  status="complete"
                />
                <ChainOfThoughtStep
                  label="Deciding next action"
                  status="pending"
                />
              </ChainOfThoughtContent>
            </ChainOfThought>
          </div>

        </div>
      </div>


    </div>
  );
}
