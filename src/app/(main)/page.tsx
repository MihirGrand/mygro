"use client";

import { Card } from "~/components/ui/card";
import useUser from "~/hooks/useUser";

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold"></h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

    </div>
  );
}
