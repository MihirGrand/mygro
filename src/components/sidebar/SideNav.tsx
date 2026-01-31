"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LogOut, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { NavItems } from "./config";
import { cn } from "~/lib/utils";
import { useAtom } from "jotai";
import { usePathname, useRouter } from "next/navigation";
import { sidebarExpandedAtom } from "~/store/atom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { FullWidthThemeSwitcher } from "~/components/ui/theme-switcher";
import useUser from "~/hooks/useUser";
import { ScrollArea } from "~/components/ui/scroll-area";

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarExpanded, setIsSidebarExpanded] =
    useAtom(sidebarExpandedAtom);
  const [isClient, setIsClient] = useState(false);
  const [activePath, setActivePath] = useState("");

  const { user, isLoading: isLoadingUser, isAdmin, signOut } = useUser();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setActivePath(pathname);
  }, [pathname]);

  if (isLoadingUser) return <SideNavSkeleton />;
  if (!user) return null;

  const navItems = NavItems(pathname, isAdmin);

  const handleNavItemClick = (path: string) => {
    setActivePath(path);
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="">
      <div
        className={cn(
          isSidebarExpanded ? "w-[270px]" : "w-[68px]",
          "bg-card border-border hidden h-screen transform border-r transition-all duration-300 ease-in-out sm:flex",
        )}
      >
        <aside className="flex h-full w-full columns-1 flex-col overflow-hidden px-4 break-words">
          {/* header */}
          <div className="mt-4 shrink-0 pb-2">
            <div className="my-4 mb-6 flex items-center justify-center">
              {isSidebarExpanded ? (
                <div className="classname">
                <h1 className="text-primary text-4xl font-black tracking-tight">
                  MYGRO
                  </h1>
                  <div className="w-34 mt-2 h-[2px] bg-primary"></div>
                </div>

              ) : (
                <span className="text-primary text-4xl font-black tracking-tight">M</span>
              )}
            </div>
          </div>

          {/* scrollable nav area */}
          <ScrollArea className="flex-1">
            <div className="flex flex-col space-y-2 pr-2">
              {navItems.map((item, idx) => {
                if (item.position === "top") {
                  return (
                    <Fragment key={idx}>
                      <div className="space-y-2">
                        <SideNavItem
                          label={item.name}
                          icon={item.icon}
                          path={item.href}
                          active={pathname === item.href}
                          isSidebarExpanded={isSidebarExpanded}
                          onClick={() => router.push(item.href)}
                        />
                      </div>
                    </Fragment>
                  );
                }
                return null;
              })}
            </div>

            <div className="mt-4 flex flex-col space-y-2 pr-2">
              {navItems.map((item, idx) => {
                if (item.position === "bottom") {
                  return (
                    <Fragment key={idx}>
                      <div className="space-y-2">
                        <SideNavItem
                          label={item.name}
                          icon={item.icon}
                          path={item.href}
                          active={pathname === item.href}
                          isSidebarExpanded={isSidebarExpanded}
                          onClick={() => router.push(item.href)}
                        />
                      </div>
                    </Fragment>
                  );
                }
                return null;
              })}
            </div>
          </ScrollArea>

          {/* profile section */}
          <div className="mt-auto block shrink-0 border-t pt-2 whitespace-nowrap transition duration-200">
            {!isLoadingUser && user && (
              <div className={cn("px-2 py-4", !isSidebarExpanded && "px-0")}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      "bg-muted/50 border-border hover:bg-muted/50 flex w-full items-center gap-4 rounded-md border px-2 py-2",
                      !isSidebarExpanded && "px-0 py-0",
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isSidebarExpanded && (
                      <div className="hidden flex-1 overflow-hidden text-left md:block">
                        <p className="truncate text-sm font-medium">
                          {user?.name}
                        </p>
                        <p className="text-muted-foreground truncate text-[10px]">
                          {user?.email}
                        </p>
                      </div>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[240px]">
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1">
                      <FullWidthThemeSwitcher />
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </aside>
        <div className="relative mt-[calc(calc(90vh)-40px)]">
          <button
            type="button"
            className="border-border bg-background absolute right-[-12px] bottom-32 flex h-6 w-6 items-center justify-center rounded-full border shadow-md transition-shadow duration-300 ease-in-out hover:shadow-lg"
            onClick={toggleSidebar}
          >
            {isSidebarExpanded ? (
              <ChevronLeft size={16} className="stroke-foreground" />
            ) : (
              <ChevronRight size={16} className="stroke-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const SideNavItem: React.FC<{
  label: string;
  icon: any;
  path: string;
  active: boolean;
  isSidebarExpanded: boolean;
  onClick?: () => void;
}> = ({ label, icon, path, active, isSidebarExpanded, onClick }) => {
  return (
    <>
      {isSidebarExpanded ? (
        <Link
          href={path}
          onClick={onClick}
          className={cn(
            "text-muted-foreground hover:text-foreground flex h-full w-full items-center gap-2 rounded-xl px-3 py-2.5 transition-colors",
            active && "text-primary bg-primary/10 font-medium",
          )}
        >
          {icon}
          <span className="text-sm">{label}</span>
        </Link>
      ) : (
        <TooltipProvider disableHoverableContent>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Link
                href={path}
                onClick={onClick}
                className={cn(
                  "text-muted-foreground hover:text-foreground flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                  active && "text-primary bg-primary/10",
                )}
              >
                {icon}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-4">
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
};

function SideNavSkeleton() {
  return (
    <div className="bg-card border-border hidden h-screen w-[270px] animate-pulse border-r sm:flex">
      <div className="flex h-full w-full flex-col px-4">
        <div className="mt-4 pb-2">
          <div className="bg-muted my-4 mb-6 mx-auto h-7 w-32 rounded" />
        </div>
        <div className="flex-1 space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-muted h-10 w-full rounded-xl" />
          ))}
        </div>
        <div className="border-t py-4">
          <div className="bg-muted h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
