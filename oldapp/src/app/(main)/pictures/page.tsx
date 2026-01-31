"use client";

import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Image as ImageIcon,
  Camera,
  Download,
  Grid3X3,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useDevices } from "~/hooks/useDevices";
import { usePhotos, useRemoteAction } from "~/hooks/useData";

type MediaCategory = "all" | "photos" | "screenshots";
type ViewMode = "grid" | "list";

const ITEMS_PER_PAGE = 50;

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

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PicturesPage() {
  const { selectedDevice, isLoading: isLoadingDevices } = useDevices();
  const [category, setCategory] = useState<MediaCategory>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: photosData,
    isLoading: isLoadingPhotos,
    isFetching,
    refetch,
  } = usePhotos(selectedDevice?.id || null, {
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  });

  const remoteAction = useRemoteAction();

  const photos = photosData?.photos || [];
  const totalPhotos = photosData?.total || 0;
  const totalPages = Math.ceil(totalPhotos / ITEMS_PER_PAGE);

  // filter by category
  const filteredPhotos = photos.filter((photo) => {
    if (category === "all") return true;
    if (category === "photos") return photo.actionType === "TAKE_PHOTO";
    if (category === "screenshots")
      return photo.actionType === "TAKE_SCREENSHOT";
    return true;
  });

  const handleTakePhoto = async () => {
    if (!selectedDevice?.id) return;
    try {
      await remoteAction.mutateAsync({
        childId: selectedDevice.id,
        action: "TAKE_PHOTO",
      });
    } catch (error) {
      console.error("Take photo failed:", error);
    }
  };

  const handleTakeScreenshot = async () => {
    if (!selectedDevice?.id) return;
    try {
      await remoteAction.mutateAsync({
        childId: selectedDevice.id,
        action: "TAKE_SCREENSHOT",
      });
    } catch (error) {
      console.error("Take screenshot failed:", error);
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
        <ImageIcon className="text-muted-foreground h-16 w-16 opacity-50" />
        <div className="text-muted-foreground text-center">
          <p className="text-lg font-medium">No device selected</p>
          <p className="mt-1 text-sm">
            Connect a child device to view pictures
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
            <h1 className="text-xl font-bold">Pictures</h1>
            <p className="text-muted-foreground text-sm">
              {totalPhotos} photos from {selectedDevice.deviceName}
              {isFetching && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Refreshing...
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTakePhoto}
              disabled={remoteAction.isPending}
            >
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTakeScreenshot}
              disabled={remoteAction.isPending}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Screenshot
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* filters */}
      <div className="shrink-0 border-b px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            value={category}
            onValueChange={(v) => setCategory(v as MediaCategory)}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoadingPhotos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="text-muted-foreground h-12 w-12 opacity-50" />
              <p className="text-muted-foreground mt-4 text-center">
                No photos captured yet
              </p>
              <p className="text-muted-foreground mt-1 text-center text-sm">
                Use the buttons above to capture photos or screenshots
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTakePhoto}
                  disabled={remoteAction.isPending}
                >
                  {remoteAction.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTakeScreenshot}
                  disabled={remoteAction.isPending}
                >
                  {remoteAction.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="mr-2 h-4 w-4" />
                  )}
                  Screenshot
                </Button>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border"
                  onClick={() => setSelectedMedia(photo)}
                >
                  <img
                    src={photo.imageUrl}
                    alt="Captured"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-2 transition-colors group-hover:bg-black/50">
                    <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          photo.actionType === "TAKE_PHOTO"
                            ? "bg-blue-500/80 text-white"
                            : "bg-purple-500/80 text-white",
                        )}
                      >
                        {photo.actionType === "TAKE_PHOTO" ? (
                          <Camera className="h-3 w-3" />
                        ) : (
                          <ImageIcon className="h-3 w-3" />
                        )}
                        {photo.actionType === "TAKE_PHOTO"
                          ? "Photo"
                          : "Screenshot"}
                      </div>
                    </div>
                    <div className="opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="text-xs text-white">
                        {formatTimeAgo(photo.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <div className="divide-y">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="hover:bg-muted/50 flex cursor-pointer items-center gap-4 p-4 transition-colors"
                    onClick={() => setSelectedMedia(photo)}
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={photo.imageUrl}
                        alt="Captured"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                            photo.actionType === "TAKE_PHOTO"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-purple-500/10 text-purple-500",
                          )}
                        >
                          {photo.actionType === "TAKE_PHOTO" ? (
                            <Camera className="h-3 w-3" />
                          ) : (
                            <ImageIcon className="h-3 w-3" />
                          )}
                          {photo.actionType === "TAKE_PHOTO"
                            ? "Photo"
                            : "Screenshot"}
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {formatDateTime(photo.createdAt)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={photo.imageUrl} download target="_blank">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="shrink-0 border-t px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalPhotos)} of{" "}
              {totalPhotos} photos
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* lightbox dialog */}
      <Dialog
        open={!!selectedMedia}
        onOpenChange={(open) => !open && setSelectedMedia(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMedia?.actionType === "TAKE_PHOTO"
                ? "Photo"
                : "Screenshot"}
            </DialogTitle>
          </DialogHeader>
          {selectedMedia && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg">
                <img
                  src={selectedMedia.imageUrl}
                  alt="Captured"
                  className="h-auto w-full"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Captured {formatDateTime(selectedMedia.createdAt)}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedMedia.imageUrl} download target="_blank">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedMedia.imageUrl} target="_blank">
                      <Maximize2 className="mr-2 h-4 w-4" />
                      Full Size
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
