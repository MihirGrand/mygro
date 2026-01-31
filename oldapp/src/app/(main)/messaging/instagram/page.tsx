"use client";

import { useState, useMemo } from "react";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  Heart,
  Image as ImageIcon,
  Clock,
  Send,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useDevices } from "~/hooks/useDevices";

interface Contact {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  isVerified: boolean;
}

interface Message {
  id: string;
  contactId: string;
  content: string;
  timestamp: string;
  type: "text" | "image" | "story_reply" | "reel_share";
  isOutgoing: boolean;
  isLiked: boolean;
}

// mock contacts
const mockContacts: Contact[] = [
  {
    id: "1",
    username: "best_friend_2024",
    displayName: "Best Friend",
    lastMessage: "That reel was hilarious 😂",
    lastMessageTime: "2h",
    unreadCount: 3,
    isOnline: true,
    isVerified: false,
  },
  {
    id: "2",
    username: "school_buddy",
    displayName: "School Buddy",
    lastMessage: "Replied to your story",
    lastMessageTime: "5h",
    unreadCount: 0,
    isOnline: true,
    isVerified: false,
  },
  {
    id: "3",
    username: "cousin_sam",
    displayName: "Cousin Sam",
    lastMessage: "See you at the party!",
    lastMessageTime: "1d",
    unreadCount: 0,
    isOnline: false,
    isVerified: false,
  },
  {
    id: "4",
    username: "neighbor_kid",
    displayName: "Neighbor",
    lastMessage: "Can you come out to play?",
    lastMessageTime: "2d",
    unreadCount: 0,
    isOnline: false,
    isVerified: false,
  },
  {
    id: "5",
    username: "gaming_squad",
    displayName: "Gaming Squad",
    lastMessage: "Who's online tonight?",
    lastMessageTime: "3d",
    unreadCount: 15,
    isOnline: false,
    isVerified: false,
  },
];

// mock messages
const mockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      contactId: "1",
      content: "Did you see that new movie?",
      timestamp: "Yesterday",
      type: "text",
      isOutgoing: false,
      isLiked: false,
    },
    {
      id: "m2",
      contactId: "1",
      content: "Not yet! Is it good?",
      timestamp: "Yesterday",
      type: "text",
      isOutgoing: true,
      isLiked: false,
    },
    {
      id: "m3",
      contactId: "1",
      content: "SO good! You have to watch it",
      timestamp: "Yesterday",
      type: "text",
      isOutgoing: false,
      isLiked: true,
    },
    {
      id: "m4",
      contactId: "1",
      content: "Shared a reel",
      timestamp: "2h ago",
      type: "reel_share",
      isOutgoing: false,
      isLiked: false,
    },
    {
      id: "m5",
      contactId: "1",
      content: "That reel was hilarious 😂",
      timestamp: "2h ago",
      type: "text",
      isOutgoing: false,
      isLiked: false,
    },
  ],
  "2": [
    {
      id: "m6",
      contactId: "2",
      content: "Nice pic! Where was that?",
      timestamp: "5h ago",
      type: "story_reply",
      isOutgoing: false,
      isLiked: false,
    },
    {
      id: "m7",
      contactId: "2",
      content: "Thanks! It was at the beach last weekend",
      timestamp: "5h ago",
      type: "text",
      isOutgoing: true,
      isLiked: false,
    },
    {
      id: "m8",
      contactId: "2",
      content: "Replied to your story",
      timestamp: "5h ago",
      type: "story_reply",
      isOutgoing: false,
      isLiked: false,
    },
  ],
};

export default function InstagramPage() {
  const { selectedDevice, isLoading: isLoadingDevices } = useDevices();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return mockContacts;
    const query = searchQuery.toLowerCase();
    return mockContacts.filter(
      (c) =>
        c.displayName.toLowerCase().includes(query) ||
        c.username.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const selectedContact = selectedContactId
    ? mockContacts.find((c) => c.id === selectedContactId)
    : null;

  const messages = selectedContactId
    ? mockMessages[selectedContactId] || []
    : [];

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
            Select a device to view Instagram messages
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* header */}
      <div className="shrink-0 border-b bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Instagram</h1>
            <p className="text-sm text-white/80">
              {filteredContacts.length} conversations from{" "}
              {selectedDevice.deviceName}
            </p>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="flex flex-1 overflow-hidden">
        {/* contacts list */}
        <div className="bg-background flex w-80 shrink-0 flex-col border-r lg:w-96">
          {/* search */}
          <div className="shrink-0 border-b p-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* contacts */}
          <ScrollArea className="flex-1">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={cn(
                  "hover:bg-muted/50 flex cursor-pointer items-center gap-3 border-b px-4 py-3 transition-colors",
                  selectedContactId === contact.id && "bg-muted",
                )}
              >
                <div className="relative">
                  <Avatar className="h-14 w-14 ring-2 ring-pink-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {contact.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {contact.isOnline && (
                    <div className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate font-semibold">
                      {contact.displayName}
                    </p>
                    {contact.isVerified && (
                      <svg
                        className="h-4 w-4 text-blue-500"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <p className="text-muted-foreground truncate text-sm">
                      {contact.lastMessage}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {contact.lastMessageTime}
                      </span>
                      {contact.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-1 text-xs font-medium text-white">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* chat area */}
        <div className="flex flex-1 flex-col">
          {selectedContact ? (
            <>
              {/* chat header */}
              <div className="bg-muted/30 flex shrink-0 items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-pink-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {selectedContact.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="font-semibold">
                        {selectedContact.displayName}
                      </p>
                      {selectedContact.isVerified && (
                        <svg
                          className="h-4 w-4 text-blue-500"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      @{selectedContact.username}
                      {selectedContact.isOnline && " • Active now"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-end gap-2",
                        message.isOutgoing ? "justify-end" : "justify-start",
                      )}
                    >
                      {!message.isOutgoing && (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-xs text-white">
                            {selectedContact.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "group relative max-w-[70%] rounded-3xl px-4 py-2.5",
                          message.isOutgoing
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                            : "bg-muted",
                          message.type === "story_reply" &&
                            "border-l-4 border-pink-500",
                          message.type === "reel_share" &&
                            "border-l-4 border-purple-500",
                        )}
                      >
                        {message.type === "story_reply" && (
                          <p className="mb-1 text-xs opacity-70">
                            Replied to your story
                          </p>
                        )}
                        {message.type === "reel_share" && (
                          <p className="mb-1 text-xs opacity-70">Shared a reel</p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <span
                          className={cn(
                            "mt-1 block text-[10px] opacity-70",
                            message.isOutgoing
                              ? "text-right"
                              : "text-muted-foreground",
                          )}
                        >
                          {message.timestamp}
                        </span>
                        {message.isLiked && (
                          <div className="absolute -bottom-2 right-2">
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* input (read-only) */}
              <div className="bg-muted/30 shrink-0 border-t p-3">
                <div className="text-muted-foreground bg-muted flex items-center justify-center rounded-full py-3 text-sm">
                  <Clock className="mr-2 h-4 w-4" />
                  Viewing recorded messages (read-only)
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="text-muted-foreground text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10">
                  <Send className="h-12 w-12 text-pink-500" />
                </div>
                <p className="text-lg font-medium">Instagram Messages</p>
                <p className="mt-1 text-sm">
                  Select a conversation to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
