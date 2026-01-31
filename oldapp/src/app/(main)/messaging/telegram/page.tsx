"use client";

import { useState, useMemo } from "react";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  Search,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Pin,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useDevices } from "~/hooks/useDevices";

interface Contact {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  isPinned: boolean;
  isMuted: boolean;
  isGroup: boolean;
  memberCount?: number;
}

interface Message {
  id: string;
  contactId: string;
  content: string;
  timestamp: string;
  type: "text" | "photo" | "video" | "voice" | "sticker" | "document";
  isOutgoing: boolean;
  status: "sent" | "delivered" | "read";
  replyTo?: string;
}

// mock contacts
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Family Group",
    lastMessage: "Mom: Don't forget dinner at 7!",
    lastMessageTime: "1h",
    unreadCount: 5,
    isOnline: false,
    isPinned: true,
    isMuted: false,
    isGroup: true,
    memberCount: 6,
  },
  {
    id: "2",
    name: "Best Friend",
    username: "bestie_forever",
    lastMessage: "Check out this meme 😂",
    lastMessageTime: "2h",
    unreadCount: 2,
    isOnline: true,
    isPinned: true,
    isMuted: false,
    isGroup: false,
  },
  {
    id: "3",
    name: "Study Group",
    lastMessage: "Alex: Anyone has the notes?",
    lastMessageTime: "3h",
    unreadCount: 12,
    isOnline: false,
    isPinned: false,
    isMuted: true,
    isGroup: true,
    memberCount: 25,
  },
  {
    id: "4",
    name: "Dad",
    username: "dad_official",
    lastMessage: "Good job on the test!",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    isOnline: false,
    isPinned: false,
    isMuted: false,
    isGroup: false,
  },
  {
    id: "5",
    name: "Gaming Channel",
    lastMessage: "New update released!",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    isOnline: false,
    isPinned: false,
    isMuted: true,
    isGroup: true,
    memberCount: 1500,
  },
  {
    id: "6",
    name: "Cousin",
    username: "cousin_cool",
    lastMessage: "When are you visiting?",
    lastMessageTime: "2d",
    unreadCount: 0,
    isOnline: true,
    isPinned: false,
    isMuted: false,
    isGroup: false,
  },
];

// mock messages
const mockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      contactId: "1",
      content: "Hi everyone!",
      timestamp: "10:00 AM",
      type: "text",
      isOutgoing: false,
      status: "read",
    },
    {
      id: "m2",
      contactId: "1",
      content: "Hey! What's the plan for today?",
      timestamp: "10:05 AM",
      type: "text",
      isOutgoing: true,
      status: "read",
    },
    {
      id: "m3",
      contactId: "1",
      content: "We're having dinner together at 7",
      timestamp: "10:10 AM",
      type: "text",
      isOutgoing: false,
      status: "read",
    },
    {
      id: "m4",
      contactId: "1",
      content: "Sounds great! I'll be there",
      timestamp: "10:15 AM",
      type: "text",
      isOutgoing: true,
      status: "read",
    },
    {
      id: "m5",
      contactId: "1",
      content: "Don't forget dinner at 7!",
      timestamp: "1h ago",
      type: "text",
      isOutgoing: false,
      status: "read",
    },
  ],
  "2": [
    {
      id: "m6",
      contactId: "2",
      content: "Yo! You online?",
      timestamp: "2h ago",
      type: "text",
      isOutgoing: false,
      status: "read",
    },
    {
      id: "m7",
      contactId: "2",
      content: "Yeah what's up?",
      timestamp: "2h ago",
      type: "text",
      isOutgoing: true,
      status: "read",
    },
    {
      id: "m8",
      contactId: "2",
      content: "Check out this meme 😂",
      timestamp: "2h ago",
      type: "text",
      isOutgoing: false,
      status: "read",
    },
  ],
  "3": [
    {
      id: "m9",
      contactId: "3",
      content: "Does anyone have the chemistry notes?",
      timestamp: "3h ago",
      type: "text",
      isOutgoing: false,
      status: "read",
    },
    {
      id: "m10",
      contactId: "3",
      content: "I can share mine",
      timestamp: "3h ago",
      type: "text",
      isOutgoing: true,
      status: "read",
    },
    {
      id: "m11",
      contactId: "3",
      content: "Anyone has the notes?",
      timestamp: "3h ago",
      type: "text",
      isOutgoing: false,
      status: "read",
    },
  ],
};

function MessageStatus({ status }: { status: Message["status"] }) {
  if (status === "sent") {
    return <Check className="h-3 w-3 text-gray-400" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="h-3 w-3 text-gray-400" />;
  }
  return <CheckCheck className="h-3 w-3 text-blue-500" />;
}

function formatMemberCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K members`;
  }
  return `${count} members`;
}

export default function TelegramPage() {
  const { selectedDevice, isLoading: isLoadingDevices } = useDevices();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );

  const filteredContacts = useMemo(() => {
    let contacts = mockContacts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      contacts = contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.username?.toLowerCase().includes(query),
      );
    }

    // sort: pinned first, then by time
    return [...contacts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
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
            Select a device to view Telegram messages
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* header */}
      <div className="shrink-0 border-b bg-[#0088cc] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Telegram</h1>
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
                  <Avatar className="h-12 w-12">
                    <AvatarFallback
                      className={cn(
                        "text-white",
                        contact.isGroup
                          ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                          : "bg-gradient-to-br from-[#0088cc] to-[#00a8e8]",
                      )}
                    >
                      {contact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {!contact.isGroup && contact.isOnline && (
                    <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {contact.isPinned && (
                        <Pin className="h-3 w-3 rotate-45 text-gray-400" />
                      )}
                      <p className="truncate font-medium">{contact.name}</p>
                      {contact.isMuted && (
                        <VolumeX className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {contact.lastMessageTime}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <p className="text-muted-foreground truncate text-sm">
                      {contact.lastMessage}
                    </p>
                    {contact.unreadCount > 0 && (
                      <span
                        className={cn(
                          "ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-xs font-medium text-white",
                          contact.isMuted ? "bg-gray-400" : "bg-[#0088cc]",
                        )}
                      >
                        {contact.unreadCount}
                      </span>
                    )}
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
                  <Avatar className="h-10 w-10">
                    <AvatarFallback
                      className={cn(
                        "text-white",
                        selectedContact.isGroup
                          ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                          : "bg-gradient-to-br from-[#0088cc] to-[#00a8e8]",
                      )}
                    >
                      {selectedContact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedContact.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {selectedContact.isGroup
                        ? formatMemberCount(selectedContact.memberCount || 0)
                        : selectedContact.isOnline
                          ? "online"
                          : `last seen ${selectedContact.lastMessageTime}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedContact.isGroup && (
                    <button className="text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors">
                      <Phone className="h-5 w-5" />
                    </button>
                  )}
                  <button className="text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* messages */}
              <ScrollArea className="flex-1 bg-[url('/telegram-bg.png')] bg-repeat p-4">
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.isOutgoing ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-3 py-2 shadow-sm",
                          message.isOutgoing
                            ? "rounded-br-sm bg-[#effdde] dark:bg-[#2b5f3f]"
                            : "bg-card rounded-bl-sm",
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="mt-1 flex items-center justify-end gap-1">
                          <span className="text-muted-foreground text-[10px]">
                            {message.timestamp}
                          </span>
                          {message.isOutgoing && (
                            <MessageStatus status={message.status} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* input (read-only) */}
              <div className="bg-muted/30 shrink-0 border-t p-3">
                <div className="text-muted-foreground bg-muted flex items-center justify-center rounded-lg py-3 text-sm">
                  <Clock className="mr-2 h-4 w-4" />
                  Viewing recorded messages (read-only)
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="text-muted-foreground text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#0088cc]/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-12 w-12 text-[#0088cc]"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">Telegram Messages</p>
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
