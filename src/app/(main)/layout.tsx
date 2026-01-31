"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useUser from "~/hooks/useUser";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, signOut } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="flex h-14 items-center justify-between px-6">
          <h1 className="text-lg font-semibold">MyGro</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">{user.name}</span>
            <button
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
