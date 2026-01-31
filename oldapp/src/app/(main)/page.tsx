"use client";

import { useRouter } from "next/navigation";
import { Card } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Phone,
  Users,
  Image,
  MapPin,
  Battery,
  Wifi,
  WifiOff,
  ChevronRight,
  Clock,
  MessageSquare,
  Camera,
} from "lucide-react";
import { cn } from "~/lib/utils";
import {
  useDevices,
  useDeviceStats,
  useRecentActivity,
  Activity,
} from "~/hooks/useDevices";

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  onClick,
  badge,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  iconColor: string;
  onClick?: () => void;
  badge?: number;
}) {
  return (
    <Card
      className={cn(
        "group relative flex flex-col justify-between p-4",
        onClick && "hover:bg-muted/50 cursor-pointer transition-colors",
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
          )}
        </div>
        <div className="relative">
          <div className={cn("rounded-lg p-2.5", iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </div>
      </div>
      {onClick && (
        <div className="text-primary mt-3 flex items-center text-xs opacity-0 transition-opacity group-hover:opacity-100">
          View details
          <ChevronRight className="ml-1 h-3 w-3" />
        </div>
      )}
    </Card>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const getIcon = () => {
    switch (activity.type) {
      case "call":
        return <Phone className="h-4 w-4 text-green-500" />;
      case "contact":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "picture":
        return <Camera className="h-4 w-4 text-purple-500" />;
      case "location":
        return <MapPin className="h-4 w-4 text-orange-500" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-cyan-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBgColor = () => {
    switch (activity.type) {
      case "call":
        return "bg-green-500/10";
      case "contact":
        return "bg-blue-500/10";
      case "picture":
        return "bg-purple-500/10";
      case "location":
        return "bg-orange-500/10";
      case "message":
        return "bg-cyan-500/10";
      default:
        return "bg-gray-500/10";
    }
  };

  return (
    <div className="flex items-start gap-3 border-b py-3 last:border-b-0">
      <div className={cn("rounded-lg p-2", getBgColor())}>{getIcon()}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{activity.title}</p>
        <p className="text-muted-foreground truncate text-xs">
          {activity.description}
        </p>
      </div>
      <span className="text-muted-foreground shrink-0 text-xs">
        {formatTimeAgo(activity.timestamp)}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { selectedDevice, isLoading: isLoadingDevices } = useDevices();
  const { data: stats, isLoading: isLoadingStats } = useDeviceStats(
    selectedDevice?.id || null,
  );
  const { data: activities, isLoading: isLoadingActivities } =
    useRecentActivity(selectedDevice?.id || null);

  if (isLoadingDevices) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!selectedDevice) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-muted-foreground text-center">
          <p className="text-lg font-medium">No device selected</p>
          <p className="mt-1 text-sm">
            Connect a child device to start monitoring
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* header */}
      <div className="shrink-0 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Monitor {selectedDevice.deviceName}
            </p>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="flex min-h-0 flex-1 gap-6 p-6">
        {/* left column */}
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {/* stats grid */}
          <div className="grid shrink-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Calls"
              value={stats?.totalCalls || 0}
              subtitle={
                stats?.unreadCalls
                  ? `${stats.unreadCalls} unread`
                  : "All caught up"
              }
              icon={Phone}
              iconColor="bg-green-500/10 text-green-500"
              onClick={() => router.push("/calls")}
              badge={stats?.unreadCalls}
            />
            <StatCard
              title="Contacts"
              value={stats?.totalContacts || 0}
              subtitle={
                stats?.newContacts
                  ? `${stats.newContacts} new`
                  : "No new contacts"
              }
              icon={Users}
              iconColor="bg-blue-500/10 text-blue-500"
            />
            <StatCard
              title="Pictures"
              value={stats?.totalPictures || 0}
              subtitle={
                stats?.recentPictures
                  ? `${stats.recentPictures} recent`
                  : "No recent pictures"
              }
              icon={Image}
              iconColor="bg-purple-500/10 text-purple-500"
              onClick={() => router.push("/pictures")}
              badge={stats?.recentPictures}
            />
          </div>

          {/* location card */}
          <Card className="shrink-0 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Last Location</h2>
              <button
                onClick={() => router.push("/location")}
                className="text-primary flex items-center text-sm hover:underline"
              >
                View map
                <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
            {stats?.lastLocation ? (
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-orange-500/10 p-2.5">
                  <MapPin className="h-5 w-5 text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {stats.lastLocation.address || "Unknown location"}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {stats.lastLocation.latitude.toFixed(6)},{" "}
                    {stats.lastLocation.longitude.toFixed(6)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Updated {formatTimeAgo(stats.lastLocation.timestamp)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground py-4 text-center">
                <MapPin className="mx-auto h-6 w-6 opacity-50" />
                <p className="mt-1 text-sm">No location data available</p>
              </div>
            )}
          </Card>

          {/* quick actions */}
          <div className="grid shrink-0 gap-3 sm:grid-cols-3">
            <Card
              className="hover:bg-muted/50 cursor-pointer p-3 transition-colors"
              onClick={() => router.push("/live")}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <Camera className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Live Camera</p>
                  <p className="text-muted-foreground text-xs">
                    View device camera
                  </p>
                </div>
              </div>
            </Card>
            <Card
              className="hover:bg-muted/50 cursor-pointer p-3 transition-colors"
              onClick={() => router.push("/files")}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-cyan-500/10 p-2">
                  <Image className="h-4 w-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">File Explorer</p>
                  <p className="text-muted-foreground text-xs">
                    Browse device files
                  </p>
                </div>
              </div>
            </Card>
            <Card
              className="hover:bg-muted/50 cursor-pointer p-3 transition-colors"
              onClick={() => router.push("/messaging/whatsapp")}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Messages</p>
                  <p className="text-muted-foreground text-xs">
                    View conversations
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* device status bar at bottom */}
          <div className="mt-auto shrink-0">
            <Card className="flex items-center justify-between p-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {selectedDevice.isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="text-muted-foreground h-4 w-4" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      selectedDevice.isOnline
                        ? "text-green-500"
                        : "text-muted-foreground",
                    )}
                  >
                    {selectedDevice.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                {selectedDevice.batteryLevel && (
                  <div className="flex items-center gap-2">
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
                    <span className="text-sm font-medium">
                      {selectedDevice.batteryLevel}%
                    </span>
                  </div>
                )}
              </div>
              <span className="text-muted-foreground text-xs">
                {selectedDevice.deviceModel}
              </span>
            </Card>
          </div>
        </div>

        {/* right column - activity */}
        <Card className="flex w-80 shrink-0 flex-col overflow-hidden">
          <div className="shrink-0 border-b p-4">
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="px-4">
              {isLoadingActivities ? (
                <div className="text-muted-foreground py-8 text-center">
                  Loading...
                </div>
              ) : !activities || activities.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <Clock className="mx-auto h-8 w-8 opacity-50" />
                  <p className="mt-2">No recent activity</p>
                </div>
              ) : (
                <div className="py-1">
                  {activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
