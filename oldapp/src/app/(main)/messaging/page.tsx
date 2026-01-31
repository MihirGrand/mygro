"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MessagingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/messaging/whatsapp");
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-muted-foreground">Redirecting...</div>
    </div>
  );
}
