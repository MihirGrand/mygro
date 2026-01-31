"use client";

import { Card } from "~/components/ui/card";
import useUser from "~/hooks/useUser";
import { Ticket, Bot, MessageSquare, Clock } from "lucide-react";

export default function MyTicketsPage() {
  const { user } = useUser();

  return (
    <div className="flex h-full">
      {/* main content */}
      <div className="flex-1 p-6">

      </div>

      {/* agent panel */}
      <div className="hidden w-[28rem] border-l lg:block">
        <div className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-semibold">Agent </h2>
          </div>



        </div>
      </div>
    </div>
  );
}
