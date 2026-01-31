"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import SideNav from "~/components/sidebar/SideNav";
import SideNavLoader from "~/components/loaders/SideNavLoader";
import useUser from "~/hooks/useUser";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { Menu, Smartphone, Wifi, WifiOff, Battery } from "lucide-react";
import { NavItems } from "~/components/sidebar/config";
import { cn } from "~/lib/utils";
import { useDevices } from "~/hooks/useDevices";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: isLoadingUser, isAuthenticated } = useUser();
  const { selectedDevice, isLoading: isLoadingDevices } = useDevices();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoadingUser && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoadingUser, isAuthenticated, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isLoadingUser) {
    return <SideNavLoader />;
  }

  if (!user) {
    return null;
  }

  const navItems = NavItems(user.role, pathname);

  return (
    <div
      suppressHydrationWarning
      className="relative flex h-screen w-full overflow-y-hidden"
    >
      <div className="sticky top-0 hidden h-screen md:block">
        <SideNav />
      </div>

      <div className="flex w-full flex-col">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2 md:hidden">
          <div className="flex items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-full flex-col">
                  <div className="flex items-center gap-2 border-b px-4 py-4">
                    <Smartphone className="text-primary h-5 w-5" />
                    <span className="text-primary text-lg font-bold">
                      Parent Control
                    </span>
                  </div>
                  <nav className="flex-1 space-y-1 p-4">
                    {navItems.map((item) => {
                      const isActive = item.active;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.icon}
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>
                  <div className="border-t p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full">
                        <span className="text-primary text-sm font-medium">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {user.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {user.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <Smartphone className="text-primary h-5 w-5" />
              <span className="text-primary font-bold">Parent Control</span>
            </div>
          </div>

          {/* device status in mobile header */}
          {selectedDevice && (
            <div className="flex items-center gap-2">
              {selectedDevice.isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="text-muted-foreground h-4 w-4" />
              )}
              {selectedDevice.batteryLevel && (
                <div className="flex items-center gap-1">
                  <Battery
                    className={cn(
                      "h-4 w-4",
                      selectedDevice.batteryLevel > 50
                        ? "text-green-500"
                        : selectedDevice.batteryLevel > 20
                          ? "text-orange-500"
                          : "text-red-500",
                    )}
                  />
                  <span className="text-xs font-medium">
                    {selectedDevice.batteryLevel}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="scrollbar h-full flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
