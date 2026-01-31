"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Settings,
  LogOut,
  Smartphone,
  Check,
  Wifi,
  WifiOff,
  Battery,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { NavItems } from "./config";
import { cn } from "~/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { useAtom } from "jotai";
import { usePathname, useRouter } from "next/navigation";
import SideNavLoader from "../loaders/SideNavLoader";
import { Separator } from "../ui/separator";
import { sidebarExpandedAtom } from "~/store/atom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { FullWidthThemeSwitcher } from "~/components/ui/theme-switcher";
import useUser from "~/hooks/useUser";
import { useDevices } from "~/hooks/useDevices";
import { ScrollArea } from "~/components/ui/scroll-area";

const MotionCollapsibleContent = motion(CollapsibleContent);

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarExpanded, setIsSidebarExpanded] =
    useAtom(sidebarExpandedAtom);
  const [isClient, setIsClient] = useState(false);
  const [activePath, setActivePath] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  const { user, isLoading: isLoadingUser, signOut } = useUser();
  const {
    devices,
    selectedDevice,
    selectDevice,
    isLoading: isLoadingDevices,
  } = useDevices();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isSidebarExpanded) {
      setCollapsedGroups({});
    }
  }, [isSidebarExpanded]);

  useEffect(() => {
    setActivePath(pathname);
  }, [pathname]);

  if (isLoadingUser) return <SideNavLoader />;
  if (!user) return null;

  const navItems = NavItems(user.role, pathname);

  const handleNavItemClick = (path: string) => {
    setActivePath(path);
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
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
                <h1 className="text-primary text-xl font-bold tracking-tight">
                  Androsploit
                </h1>
              ) : (
                <span className="text-primary text-xl font-bold">A</span>
              )}
            </div>

            {/* device selector card */}
            {isSidebarExpanded && selectedDevice && (
              <div className="bg-muted/50 mb-4 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                      <Smartphone className="text-primary h-4 w-4" />
                    </div>
                    <div
                      className={cn(
                        "absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                        selectedDevice.isOnline
                          ? "bg-green-500"
                          : "bg-gray-400",
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {selectedDevice.deviceName}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={cn(
                          selectedDevice.isOnline
                            ? "text-green-500"
                            : "text-muted-foreground",
                        )}
                      >
                        {selectedDevice.isOnline ? "Online" : "Offline"}
                      </span>
                      {selectedDevice.batteryLevel && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Battery className="h-3 w-3" />
                            {selectedDevice.batteryLevel}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* scrollable nav area */}
          <ScrollArea className="flex-1">
            <div className="flex flex-col space-y-2 pr-2">
              {navItems.map((item, idx) => {
                if (item.position === "top") {
                  if (item.nested && item.nested.length > 0) {
                    const isGroupOpen = collapsedGroups[item.name] !== false;
                    const isAnyNestedActive = item.nested.some((nestedItem) =>
                      pathname.startsWith(nestedItem.href),
                    );
                    const isMainItemActive = item.active || isAnyNestedActive;

                    return (
                      <div key={idx}>
                        <Collapsible
                          open={isGroupOpen}
                          onOpenChange={() => toggleGroup(item.name)}
                        >
                          <CollapsibleTrigger asChild>
                            <div
                              className={cn(
                                "text-muted-foreground flex w-full cursor-pointer items-center justify-between rounded-xl transition-colors hover:bg-transparent",
                                "hover:bg-accent/50",
                              )}
                            >
                              <SideNavItem
                                label={item.name}
                                icon={item.icon}
                                path={item.href}
                                active={isMainItemActive}
                                isSidebarExpanded={isSidebarExpanded}
                                onClick={() => handleNavItemClick(item.href)}
                                hasNested={true}
                              />
                              <ChevronRight
                                size={16}
                                className={cn(
                                  "transition-transform duration-200",
                                  isGroupOpen && "rotate-90",
                                  !isSidebarExpanded && "hidden",
                                  "absolute right-2",
                                )}
                              />
                            </div>
                          </CollapsibleTrigger>
                          <AnimatePresence initial={false}>
                            {isGroupOpen && (
                              <MotionCollapsibleContent
                                initial={{ height: 0, opacity: 0 }}
                                animate={{
                                  height: "auto",
                                  opacity: 1,
                                  transition: {
                                    height: { duration: 0.2, ease: "easeOut" },
                                    opacity: {
                                      duration: 0.2,
                                      ease: "easeInOut",
                                    },
                                  },
                                }}
                                exit={{
                                  height: 0,
                                  opacity: 0,
                                  transition: {
                                    height: { duration: 0.2, ease: "easeIn" },
                                    opacity: { duration: 0.1 },
                                  },
                                }}
                              >
                                <motion.div
                                  initial={{ y: -10 }}
                                  animate={{ y: 0 }}
                                  exit={{ y: -10 }}
                                  transition={{
                                    duration: 0.2,
                                    ease: "easeInOut",
                                  }}
                                  className="mb-4 flex flex-col pl-6"
                                >
                                  {item.nested.map((nestedItem, nestedIdx) => (
                                    <SideSubjectitems
                                      key={nestedIdx}
                                      label={nestedItem.name}
                                      icon={nestedItem.icon}
                                      path={nestedItem.href}
                                      active={pathname.startsWith(
                                        nestedItem.href,
                                      )}
                                      isSidebarExpanded={true}
                                      isNested={true}
                                      onClick={() =>
                                        router.push(nestedItem.href)
                                      }
                                    />
                                  ))}
                                </motion.div>
                              </MotionCollapsibleContent>
                            )}
                          </AnimatePresence>
                        </Collapsible>
                        {isSidebarExpanded && isGroupOpen && (
                          <Separator className="bg-border my-2 h-[0.5px] rounded-xl" />
                        )}
                      </div>
                    );
                  } else {
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

          {/* profile section - fixed at bottom */}
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
                    {/* device selector submenu */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Smartphone className="mr-2 h-4 w-4" />
                        <span className="flex-1">Devices</span>
                        {selectedDevice && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            {selectedDevice.deviceName.slice(0, 12)}
                            {selectedDevice.deviceName.length > 12 ? "..." : ""}
                          </span>
                        )}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-[220px]">
                          {isLoadingDevices ? (
                            <div className="text-muted-foreground p-2 text-center text-sm">
                              Loading...
                            </div>
                          ) : devices.length === 0 ? (
                            <div className="text-muted-foreground p-2 text-center text-sm">
                              No devices found
                            </div>
                          ) : (
                            devices.map((device) => (
                              <DropdownMenuItem
                                key={device.id}
                                onClick={() => selectDevice(device.id)}
                                className="flex items-center gap-2"
                              >
                                <div className="relative">
                                  {device.isOnline ? (
                                    <Wifi className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <WifiOff className="text-muted-foreground h-4 w-4" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm">
                                    {device.deviceName}
                                  </p>
                                  <p className="text-muted-foreground truncate text-xs">
                                    {device.deviceModel || device.deviceId}
                                  </p>
                                </div>
                                {selectedDevice?.id === device.id && (
                                  <Check className="text-primary h-4 w-4" />
                                )}
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
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
  hasNested?: boolean;
}> = ({ label, icon, path, active, isSidebarExpanded, onClick, hasNested }) => {
  return (
    <>
      {isSidebarExpanded ? (
        <Link
          href={hasNested ? "#" : path}
          onClick={(e) => {
            if (hasNested) e.preventDefault();
            onClick?.();
          }}
          className={cn(
            "text-muted-foreground hover:text-foreground flex h-full w-full items-center gap-2 rounded-xl px-3 py-2.5 transition-colors",
            active && "text-primary font-medium",
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
                href={hasNested ? "#" : path}
                onClick={(e) => {
                  if (hasNested) e.preventDefault();
                  onClick?.();
                }}
                className={cn(
                  "text-muted-foreground hover:text-foreground flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                  active && "text-primary",
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

const SideSubjectitems: React.FC<{
  label: string;
  icon: any;
  path: string;
  active: boolean;
  isSidebarExpanded: boolean;
  isNested?: boolean;
  onClick?: () => void;
}> = ({ label, icon, path, active, isSidebarExpanded, isNested, onClick }) => {
  return (
    <Link
      href={path}
      onClick={onClick}
      className={cn(
        "text-muted-foreground hover:text-foreground flex h-full items-center gap-2 rounded-xl px-3 py-2 transition-colors",
        active && "text-primary font-medium",
        isNested && "text-sm",
      )}
    >
      {isNested ? <Minus size={14} className="mr-1" /> : icon}
      <span className="text-sm">{label}</span>
    </Link>
  );
};
