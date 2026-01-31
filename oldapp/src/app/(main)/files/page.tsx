"use client";

import { useState, useMemo } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Folder,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  Download,
  Upload,
  Trash2,
  Search,
  ChevronRight,
  ChevronLeft,
  Home,
  HardDrive,
  RefreshCw,
  MoreVertical,
  Grid3X3,
  LayoutList,
  ArrowUp,
  Copy,
  Move,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { useDevices } from "~/hooks/useDevices";

type ViewMode = "grid" | "list";

interface FileItem {
  id: string;
  name: string;
  type: "folder" | "file";
  size: number | null;
  mimeType?: string;
  modifiedAt: string;
  path: string;
}

// mock file structure
const mockFiles: Record<string, FileItem[]> = {
  "/": [
    {
      id: "1",
      name: "DCIM",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/DCIM",
    },
    {
      id: "2",
      name: "Download",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/Download",
    },
    {
      id: "3",
      name: "Documents",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/Documents",
    },
    {
      id: "4",
      name: "Music",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/Music",
    },
    {
      id: "5",
      name: "Pictures",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/Pictures",
    },
    {
      id: "6",
      name: "Videos",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/Videos",
    },
    {
      id: "7",
      name: "WhatsApp",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/WhatsApp",
    },
    {
      id: "8",
      name: "Android",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/Android",
    },
  ],
  "/DCIM": [
    {
      id: "10",
      name: "Camera",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/DCIM/Camera",
    },
    {
      id: "11",
      name: "Screenshots",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/DCIM/Screenshots",
    },
  ],
  "/DCIM/Camera": [
    {
      id: "20",
      name: "IMG_20240115_143200.jpg",
      type: "file",
      size: 2456000,
      mimeType: "image/jpeg",
      modifiedAt: new Date().toISOString(),
      path: "/DCIM/Camera/IMG_20240115_143200.jpg",
    },
    {
      id: "21",
      name: "IMG_20240114_183000.jpg",
      type: "file",
      size: 3200000,
      mimeType: "image/jpeg",
      modifiedAt: new Date(Date.now() - 86400000).toISOString(),
      path: "/DCIM/Camera/IMG_20240114_183000.jpg",
    },
    {
      id: "22",
      name: "VID_20240113_120000.mp4",
      type: "file",
      size: 45000000,
      mimeType: "video/mp4",
      modifiedAt: new Date(Date.now() - 172800000).toISOString(),
      path: "/DCIM/Camera/VID_20240113_120000.mp4",
    },
  ],
  "/Download": [
    {
      id: "30",
      name: "document.pdf",
      type: "file",
      size: 1234000,
      mimeType: "application/pdf",
      modifiedAt: new Date().toISOString(),
      path: "/Download/document.pdf",
    },
    {
      id: "31",
      name: "archive.zip",
      type: "file",
      size: 8900000,
      mimeType: "application/zip",
      modifiedAt: new Date(Date.now() - 86400000).toISOString(),
      path: "/Download/archive.zip",
    },
    {
      id: "32",
      name: "notes.txt",
      type: "file",
      size: 2500,
      mimeType: "text/plain",
      modifiedAt: new Date(Date.now() - 172800000).toISOString(),
      path: "/Download/notes.txt",
    },
  ],
  "/Documents": [
    {
      id: "40",
      name: "Work",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/Documents/Work",
    },
    {
      id: "41",
      name: "Personal",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/Documents/Personal",
    },
    {
      id: "42",
      name: "report.docx",
      type: "file",
      size: 456000,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      modifiedAt: new Date(Date.now() - 86400000).toISOString(),
      path: "/Documents/report.docx",
    },
  ],
  "/WhatsApp": [
    {
      id: "50",
      name: "Media",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/WhatsApp/Media",
    },
    {
      id: "51",
      name: "Databases",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/WhatsApp/Databases",
    },
  ],
  "/WhatsApp/Media": [
    {
      id: "60",
      name: "WhatsApp Images",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/WhatsApp/Media/WhatsApp Images",
    },
    {
      id: "61",
      name: "WhatsApp Video",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/WhatsApp/Media/WhatsApp Video",
    },
    {
      id: "62",
      name: "WhatsApp Voice Notes",
      type: "folder",
      size: null,
      modifiedAt: new Date().toISOString(),
      path: "/WhatsApp/Media/WhatsApp Voice Notes",
    },
  ],
};

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileIcon(item: FileItem) {
  if (item.type === "folder") {
    return <Folder className="h-5 w-5 text-yellow-500" />;
  }

  const mimeType = item.mimeType || "";
  if (mimeType.startsWith("image/")) {
    return <FileImage className="h-5 w-5 text-green-500" />;
  }
  if (mimeType.startsWith("video/")) {
    return <FileVideo className="h-5 w-5 text-purple-500" />;
  }
  if (mimeType.startsWith("audio/")) {
    return <FileAudio className="h-5 w-5 text-pink-500" />;
  }
  if (mimeType.includes("pdf") || mimeType.includes("document")) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (mimeType.includes("zip") || mimeType.includes("archive")) {
    return <FileArchive className="h-5 w-5 text-orange-500" />;
  }
  if (mimeType.includes("text") || mimeType.includes("json")) {
    return <FileCode className="h-5 w-5 text-blue-500" />;
  }
  return <File className="text-muted-foreground h-5 w-5" />;
}

export default function FilesPage() {
  const { selectedDevice, isLoading: isLoadingDevices } = useDevices();

  const [currentPath, setCurrentPath] = useState("/");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const files = useMemo(() => {
    const items = mockFiles[currentPath] || [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return items.filter((item) => item.name.toLowerCase().includes(query));
    }

    // sort: folders first, then files, alphabetically
    return [...items].sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [currentPath, searchQuery]);

  const pathParts = currentPath.split("/").filter(Boolean);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSelectedItems([]);
    setSearchQuery("");
  };

  const handleItemClick = (item: FileItem) => {
    if (item.type === "folder") {
      handleNavigate(item.path);
    }
  };

  const handleGoBack = () => {
    if (currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    handleNavigate("/" + parts.join("/") || "/");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

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
          <p className="mt-1 text-sm">Select a device to browse files</p>
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
            <h1 className="text-xl font-bold">File Explorer</h1>
            <p className="text-muted-foreground text-sm">
              Browse {selectedDevice.deviceName} storage
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <HardDrive className="h-4 w-4" />
              <span>Internal Storage</span>
            </div>
          </div>
        </div>
      </div>

      {/* toolbar */}
      <div className="shrink-0 border-b px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={handleGoBack}
                disabled={currentPath === "/"}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw
                  className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleNavigate("/")}
              >
                <Home className="h-4 w-4" />
              </Button>
            </div>

            {/* breadcrumb */}
            <div className="flex items-center gap-1 rounded-md border px-3 py-1.5">
              <button
                onClick={() => handleNavigate("/")}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                /
              </button>
              {pathParts.map((part, index) => (
                <div key={index} className="flex items-center">
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                  <button
                    onClick={() =>
                      handleNavigate("/" + pathParts.slice(0, index + 1).join("/"))
                    }
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    {part}
                  </button>
                </div>
              ))}
            </div>

            {/* search */}
            <div className="relative md:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* actions for selected */}
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  {selectedItems.length} selected
                </span>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}

            {/* view toggle */}
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {files.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-16">
              <Folder className="h-12 w-12 opacity-50" />
              <p className="mt-4 text-lg font-medium">Folder is empty</p>
              <p className="mt-1 text-sm">No files or folders found</p>
            </div>
          ) : viewMode === "list" ? (
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-32">Size</TableHead>
                  <TableHead className="w-48">Modified</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "cursor-pointer",
                      selectedItems.includes(item.id) && "bg-muted/50",
                    )}
                    onClick={() => handleItemClick(item)}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectItem(item.id);
                        }}
                        className="h-4 w-4 rounded border"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(item)}
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {formatFileSize(item.size)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {formatDateTime(item.modifiedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Move className="mr-2 h-4 w-4" />
                            Move
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {files.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "hover:bg-muted/50 group flex cursor-pointer flex-col items-center rounded-lg border p-4 transition-colors",
                    selectedItems.includes(item.id) && "bg-muted/50 border-primary",
                  )}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center">
                      {item.type === "folder" ? (
                        <Folder className="h-12 w-12 text-yellow-500" />
                      ) : (
                        getFileIcon(item)
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(item.id);
                      }}
                      className="absolute -top-1 -left-1 h-4 w-4 rounded border opacity-0 group-hover:opacity-100"
                    />
                  </div>
                  <p className="mt-2 max-w-full truncate text-center text-sm font-medium">
                    {item.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(item.size)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* status bar */}
      <div className="bg-muted/30 shrink-0 border-t px-6 py-2">
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>
            {files.length} items
            {files.filter((f) => f.type === "folder").length > 0 &&
              ` (${files.filter((f) => f.type === "folder").length} folders, ${files.filter((f) => f.type === "file").length} files)`}
          </span>
          <span>{currentPath}</span>
        </div>
      </div>
    </div>
  );
}
