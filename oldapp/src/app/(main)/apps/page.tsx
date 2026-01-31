"use client";

import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Search,
  Package,
  RefreshCw,
  Loader2,
  Smartphone,
  Settings,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useDevices } from "~/hooks/useDevices";
import { useInstalledApps, useTriggerSync } from "~/hooks/useData";

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AppsPage() {
  const { selectedDevice, isLoading: isLoadingDevices } = useDevices();
  const [searchQuery, setSearchQuery] = useState("");
  const [includeSystem, setIncludeSystem] = useState(false);

  const {
    data: appsData,
    isLoading: isLoadingApps,
    isFetching,
  } = useInstalledApps(selectedDevice?.id || null, {
    search: searchQuery || undefined,
    includeSystem,
  });

  const triggerSync = useTriggerSync();

  const apps = appsData?.apps || [];
  const totalApps = appsData?.total || 0;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleSync = async () => {
    if (!selectedDevice?.id) return;
    try {
      await triggerSync.mutateAsync({
        childId: selectedDevice.id,
        syncType: "apps",
      });
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  if (isLoadingDevices) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!selectedDevice) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Package className="text-muted-foreground h-16 w-16 opacity-50" />
        <div className="text-muted-foreground text-center">
          <p className="text-lg font-medium">No device selected</p>
          <p className="mt-1 text-sm">
            Connect a child device to view installed apps
          </p>
        </div>
      </div>
    );
  }

  const userApps = apps.filter((app) => !app.isSystemApp);
  const systemApps = apps.filter((app) => app.isSystemApp);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* header */}
      <div className="shrink-0 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Installed Apps</h1>
            <p className="text-muted-foreground text-sm">
              {totalApps} apps on {selectedDevice.deviceName}
              {!includeSystem && ` • Showing ${userApps.length} user apps`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={triggerSync.isPending}
            >
              {triggerSync.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Apps
            </Button>
          </div>
        </div>
      </div>

      {/* filters */}
      <div className="shrink-0 border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="include-system"
              checked={includeSystem}
              onCheckedChange={setIncludeSystem}
            />
            <Label htmlFor="include-system" className="text-sm">
              Show system apps
            </Label>
          </div>
          {isFetching && !isLoadingApps && (
            <div className="flex items-center gap-2">
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
              <span className="text-muted-foreground text-sm">Updating...</span>
            </div>
          )}
        </div>
      </div>

      {/* content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoadingApps ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="text-muted-foreground h-12 w-12 opacity-50" />
              <p className="text-muted-foreground mt-4 text-center">
                {searchQuery
                  ? "No apps found matching your search"
                  : "No apps synced yet"}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleSync}
                  disabled={triggerSync.isPending}
                >
                  {triggerSync.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync Now
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>App Name</TableHead>
                    <TableHead>Package Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead className="text-right">Synced</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((app, index) => (
                    <TableRow key={app.id}>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg",
                              app.isSystemApp
                                ? "bg-orange-500/10"
                                : "bg-primary/10"
                            )}
                          >
                            {app.isSystemApp ? (
                              <Settings className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Smartphone className="text-primary h-4 w-4" />
                            )}
                          </div>
                          <span className="font-medium">{app.appName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                          {app.packageName}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {app.versionName || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                            app.isSystemApp
                              ? "bg-orange-500/10 text-orange-500"
                              : "bg-green-500/10 text-green-500"
                          )}
                        >
                          {app.isSystemApp ? "System" : "User"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground text-sm">
                          {formatDate(app.syncedAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* stats footer */}
      {apps.length > 0 && (
        <div className="shrink-0 border-t px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="bg-green-500/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Smartphone className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{userApps.length}</p>
                  <p className="text-muted-foreground text-xs">User Apps</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-orange-500/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Settings className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{systemApps.length}</p>
                  <p className="text-muted-foreground text-xs">System Apps</p>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Total: {totalApps} apps installed
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
