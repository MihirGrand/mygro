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
  Check,
  CheckCheck,
  Image as ImageIcon,
  Mic,
  File,
  Clock,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useDevices } from "~/hooks/useDevices";

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

interface Message {
  id: string;
  contactId: string;
  content: string;
  timestamp: string;
  type: "text" | "image" | "audio" | "document";
  isOutgoing: boolean;
  status: "sent" | "delivered" | "read";
}

// mock contacts
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Mom",
    phone: "+91 98765 43210",
    lastMessage: "Okay, take care!",
    lastMessageTime: "10:32 AM",
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: "2",
    name: "Dad",
    phone: "+91 98765 43211",
    lastMessage: "Did you finish your homework?",
    lastMessageTime: "9:45 AM",
    unreadCount: 2,
    isOnline: false,
  },
  {
    id: "3",
    name: "Best Friend",
    phone: "+91 99887 76655",
    lastMessage: "Let's play tonight! 🎮",
    lastMessageTime: "Yesterday",
    unreadCount: 5,
    isOnline: true,
  },
  {
    id: "4",
    name: "Class Group",
    phone: "Group",
    lastMessage: "Teacher: Don't forget tomorrow's test",
    lastMessageTime: "Yesterday",
    unreadCount: 12,
    isOnline: false,
  },
  {
    id: "5",
    name: "Aunt",
    phone: "+91 88776 65544",
    lastMessage: "Happy Birthday! 🎂",
    lastMessageTime: "Monday",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "6",
    name: "School Friend",
    phone: "+91 77665 54433",
    lastMessage: "See you tomorrow",
    lastMessageTime: "Sunday",
    unreadCount: 0,
    isOnline: false,
  },
];

// mock messages
const mockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      contactId: "1",
      content: "Good morning!",
      timestamp: "9:00 AM",
      type: "text",
      isOutgoing: false,
      status: "read",
    },
    {
      id: "m2",
      contactId: "1",
      content: "Good morning mom!",
      timestamp: "9:05 AM",
      type: "text",
      isOutgoing: true,
      status: "read",
    },
    {
      id: "m3",
      contactId: "1",
      content: "Did you eat breakfast?",
      timestamp: "9:10 AM",
      type: "text",
      isOutgoing: false,
      status: "read",
    },
    {
      id: "m4",
      contactId: "1",
      content: "Yes, I had cereal",
      timestamp: "9:15 AM",
      type: "text",
      isOutgoing: true,
      status: "read",
    },
    {
      id: "m5",
      contactId: "1",
      content: "That's good. Don't forget to take your lunch box",
      timestamp: "10:00 AM",
      type: "text",
      isOutgoing: false,
      status: "read",
    },
    {
      id: "m6",
      contactId: "1",
      content: "I won't forget!",
      timestamp: "10:15 AM",
      type: "text",
      isOutgoing: true,
      status: "read",
    },
    {
      id: "m7",
      contactId: "1",
      content: "Okay, take care!",
      timestamp: "10:32 AM",
      type: "text",
      isOutgoing: false,
      status: "read",
    },
  ],
  "2": [
    {
      id: "m8",
      contactId: "2",
      content: "How was school today?",
      timestamp: "8:00 AM",
      type: "text",
      isOutgoing: false,
      status: "read",
    },
    {
      id: "m9",
      contactId: "2",
      content: "It was great! We had science lab",
      timestamp: "8:30 AM",
      type: "text",
      isOutgoing: true,
      status: "read",
    },
    {
      id: "m10",
      contactId: "2",
      content: "Did you finish your homework?",
      timestamp: "9:45 AM",
      type: "text",
      isOutgoing: false,
      status: "delivered",
    },
  ],
  "3": [
    {
      id: "m11",
      contactId: "3",
      content: "Hey! What's up?",
      timestamp: "Yesterday",
      type: "text",
      isOutgoing: false,
      status: "read",
    },
    {
      id: "m12",
      contactId: "3",
      content: "Nothing much, just finished studying",
      timestamp: "Yesterday",
      type: "text",
      isOutgoing: true,
      status: "read",
    },
    {
      id: "m13",
      contactId: "3",
      content: "Let's play tonight! 🎮",
      timestamp: "Yesterday",
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

export default function WhatsAppPage() {
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
        c.name.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const selectedContact = selectedContactId
    ? mockContacts.find((c) => c.id === selectedContactId)
    : null;

  const messages = selectedContactId ? mockMessages[selectedContactId] || [] : [];

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
          <p className="mt-1 text-sm">Select a device to view WhatsApp messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* header */}
      <div className="shrink-0 border-b bg-green-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">WhatsApp</h1>
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
                placeholder="Search or start new chat"
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
                    <AvatarFallback className="bg-green-500/10 text-green-600">
                      {contact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {contact.isOnline && (
                    <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-medium">{contact.name}</p>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {contact.lastMessageTime}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <p className="text-muted-foreground truncate text-sm">
                      {contact.lastMessage}
                    </p>
                    {contact.unreadCount > 0 && (
                      <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-green-500 px-1 text-xs font-medium text-white">
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
                    <AvatarFallback className="bg-green-500/10 text-green-600">
                      {selectedContact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedContact.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {selectedContact.isOnline
                        ? "online"
                        : `last seen ${selectedContact.lastMessageTime}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* messages */}
              <ScrollArea className="flex-1 bg-[url('/chat-bg.png')] bg-repeat p-4">
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
                          "max-w-[70%] rounded-lg px-3 py-2 shadow-sm",
                          message.isOutgoing
                            ? "rounded-br-none bg-green-100 dark:bg-green-900/30"
                            : "bg-card rounded-bl-none",
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
                <div className="bg-muted mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-12 w-12 text-green-500"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">WhatsApp Messages</p>
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
