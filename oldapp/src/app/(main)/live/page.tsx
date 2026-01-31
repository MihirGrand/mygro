"use client";

import { useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Camera,
  Mic,
  Monitor,
  Video,
  VideoOff,
  MicOff,
  RotateCcw,
  Maximize2,
  RefreshCw,
  Circle,
  Square,
  Clock,
  Image,
  Volume2,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useDevices } from "~/hooks/useDevices";

type ViewMode = "camera" | "audio" | "screen";
type CameraType = "rear" | "front";
type RecordingDuration = "10" | "30" | "60" | "120";

export default function LiveControlPage() {
  const { selectedDevice, isLoading: isLoadingDevices } = useDevices();

  const [activeTab, setActiveTab] = useState<ViewMode>("camera");
  const [cameraType, setCameraType] = useState<CameraType>("rear");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] =
    useState<RecordingDuration>("30");

  const handleStartStream = () => {
    setIsStreaming(true);
  };

  const handleStopStream = () => {
    setIsStreaming(false);
  };

  const handleCapture = () => {
    console.log("Capturing...");
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleSwitchCamera = () => {
    setCameraType(cameraType === "rear" ? "front" : "rear");
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
          <p className="mt-1 text-sm">
            Select a device to use live control features
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "camera" as ViewMode, label: "Camera", icon: Camera },
    { id: "audio" as ViewMode, label: "Audio", icon: Mic },
    { id: "screen" as ViewMode, label: "Screen", icon: Monitor },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* header */}
      <div className="shrink-0 border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Live Control</h1>
            <p className="text-muted-foreground text-xs">
              Real-time device access for {selectedDevice.deviceName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedDevice.isOnline ? (
              <span className="flex items-center gap-1.5 text-xs text-green-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></span>
                Online
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span className="bg-muted-foreground h-1.5 w-1.5 rounded-full"></span>
                Offline
              </span>
            )}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="shrink-0 border-b px-6">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && (
                <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* content */}
      <div className="flex-1 overflow-hidden p-4">
        {activeTab === "camera" && (
          <div className="grid h-full gap-4 lg:grid-cols-[1fr,280px]">
            {/* live view */}
            <Card className="flex flex-col overflow-hidden">
              <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Live Camera</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium",
                      cameraType === "rear"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-purple-500/10 text-purple-500",
                    )}
                  >
                    {cameraType === "rear" ? "Rear" : "Front"}
                  </span>
                </div>
                {isStreaming && (
                  <span className="flex items-center gap-1.5 text-xs text-red-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"></span>
                    LIVE
                  </span>
                )}
              </div>
              <div className="relative flex-1 bg-black">
                {isStreaming ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center text-white/50">
                      <Video className="mx-auto h-12 w-12 animate-pulse" />
                      <p className="mt-3 text-sm">Connecting to camera...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center text-white/50">
                      <VideoOff className="mx-auto h-12 w-12" />
                      <p className="mt-3 text-sm">Camera stream not active</p>
                      <p className="mt-1 text-xs">Click Start to begin</p>
                    </div>
                  </div>
                )}

                {/* overlay controls */}
                <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
                    onClick={handleSwitchCamera}
                    disabled={!isStreaming}
                  >
                    <RotateCcw className="h-4 w-4 text-white" />
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
                      onClick={handleCapture}
                      disabled={!isStreaming}
                    >
                      <Image className="h-4 w-4 text-white" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
                    >
                      <Maximize2 className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-center gap-3 border-t p-3">
                {isStreaming ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleStopStream}
                    className="gap-2"
                  >
                    <Square className="h-3.5 w-3.5" />
                    Stop Stream
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleStartStream}
                    className="gap-2"
                    disabled={!selectedDevice.isOnline}
                  >
                    <Video className="h-3.5 w-3.5" />
                    Start Stream
                  </Button>
                )}
              </div>
            </Card>

            {/* sidebar actions */}
            <div className="flex flex-col gap-3 overflow-auto">
              <Card className="p-3">
                <h3 className="mb-3 text-sm font-medium">Remote Capture</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-xs"
                    disabled={!selectedDevice.isOnline}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Take Photo (Rear)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-xs"
                    disabled={!selectedDevice.isOnline}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Take Photo (Front)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-xs"
                    disabled={!selectedDevice.isOnline}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Take Screenshot
                  </Button>
                </div>
              </Card>

              <Card className="p-3">
                <h3 className="mb-3 text-sm font-medium">Record Audio</h3>
                <div className="space-y-2">
                  <Select
                    value={recordingDuration}
                    onValueChange={(v) =>
                      setRecordingDuration(v as RecordingDuration)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <Clock className="mr-2 h-3.5 w-3.5" />
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="120">2 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-xs"
                    disabled={!selectedDevice.isOnline}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    Start Recording
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "audio" && (
          <div className="grid h-full gap-4 lg:grid-cols-[1fr,280px]">
            <Card className="flex flex-col overflow-hidden">
              <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
                <span className="text-sm font-medium">Live Audio</span>
                {isRecording && (
                  <span className="flex items-center gap-1.5 text-xs text-red-500">
                    <Circle className="h-2 w-2 animate-pulse fill-current" />
                    Recording
                  </span>
                )}
              </div>
              <div className="flex flex-1 items-center justify-center bg-black">
                {isStreaming ? (
                  <div className="text-center text-white/50">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-green-500/30 bg-green-500/10">
                      <Volume2 className="h-12 w-12 animate-pulse text-green-500" />
                    </div>
                    <p className="mt-4 text-sm">Listening...</p>
                    <div className="mt-3 flex items-center justify-center gap-0.5">
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 animate-pulse rounded-full bg-green-500"
                          style={{
                            height: `${Math.random() * 24 + 8}px`,
                            animationDelay: `${i * 50}ms`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white/50">
                    <MicOff className="mx-auto h-12 w-12" />
                    <p className="mt-3 text-sm">Audio stream not active</p>
                    <p className="mt-1 text-xs">Click Start to begin</p>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center justify-center gap-3 border-t p-3">
                {isStreaming ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleStopStream}
                    className="gap-2"
                  >
                    <Square className="h-3.5 w-3.5" />
                    Stop Listening
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleStartStream}
                    className="gap-2"
                    disabled={!selectedDevice.isOnline}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    Start Listening
                  </Button>
                )}
              </div>
            </Card>

            <div className="flex flex-col gap-3 overflow-auto">
              <Card className="p-3">
                <h3 className="mb-3 text-sm font-medium">Audio Recording</h3>
                <div className="space-y-2">
                  <Select
                    value={recordingDuration}
                    onValueChange={(v) =>
                      setRecordingDuration(v as RecordingDuration)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <Clock className="mr-2 h-3.5 w-3.5" />
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="120">2 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                  {isRecording ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2 text-xs"
                      onClick={handleStopRecording}
                    >
                      <Square className="h-3.5 w-3.5" />
                      Stop Recording
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-xs"
                      onClick={handleStartRecording}
                      disabled={!selectedDevice.isOnline}
                    >
                      <Circle className="h-3.5 w-3.5 fill-current text-red-500" />
                      Start Recording
                    </Button>
                  )}
                </div>
              </Card>

              <Card className="flex-1 p-3">
                <h3 className="mb-3 text-sm font-medium">Recent Recordings</h3>
                <div className="text-muted-foreground flex flex-col items-center justify-center py-6 text-xs">
                  <Mic className="h-6 w-6 opacity-50" />
                  <p className="mt-2">No recordings yet</p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "screen" && (
          <div className="grid h-full gap-4 lg:grid-cols-[1fr,280px]">
            <Card className="flex flex-col overflow-hidden">
              <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
                <span className="text-sm font-medium">Live Screen</span>
                {isStreaming && (
                  <span className="flex items-center gap-1.5 text-xs text-red-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"></span>
                    LIVE
                  </span>
                )}
              </div>
              <div className="relative flex-1 bg-black">
                {isStreaming ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center text-white/50">
                      <Monitor className="mx-auto h-12 w-12 animate-pulse" />
                      <p className="mt-3 text-sm">Connecting to screen...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center text-white/50">
                      <Monitor className="mx-auto h-12 w-12" />
                      <p className="mt-3 text-sm">Screen share not active</p>
                      <p className="mt-1 text-xs">Click Start to begin</p>
                    </div>
                  </div>
                )}

                <div className="absolute right-3 bottom-3 flex gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
                    onClick={handleCapture}
                    disabled={!isStreaming}
                  >
                    <Image className="h-4 w-4 text-white" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
                  >
                    <Maximize2 className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-center gap-3 border-t p-3">
                {isStreaming ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleStopStream}
                    className="gap-2"
                  >
                    <Square className="h-3.5 w-3.5" />
                    Stop Viewing
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleStartStream}
                    className="gap-2"
                    disabled={!selectedDevice.isOnline}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Start Screen View
                  </Button>
                )}
              </div>
            </Card>

            <div className="flex flex-col gap-3 overflow-auto">
              <Card className="p-3">
                <h3 className="mb-3 text-sm font-medium">Remote Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-xs"
                    disabled={!selectedDevice.isOnline}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Take Screenshot
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-xs"
                    disabled={!selectedDevice.isOnline}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh Screen
                  </Button>
                </div>
              </Card>

              <Card className="flex-1 p-3">
                <h3 className="mb-3 text-sm font-medium">Recent Screenshots</h3>
                <div className="text-muted-foreground flex flex-col items-center justify-center py-6 text-xs">
                  <Image className="h-6 w-6 opacity-50" />
                  <p className="mt-2">No screenshots yet</p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
