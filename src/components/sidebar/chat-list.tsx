"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
}

interface ChatSection {
  title: string;
  chats: Array<{
    id: string;
    title: string | null;
    updatedAt: Date;
    messageCount: number;
  }>;
}

function groupChatsByDate(
  chats: Array<{
    id: string;
    title: string | null;
    updatedAt: Date;
    _count: { messages: number };
  }>,
): ChatSection[] {
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const yesterday = new Date(
    today.getTime() - 24 * 60 * 60 * 1000,
  );

  const weekAgo = new Date(
    today.getTime() - 7 * 24 * 60 * 60 * 1000,
  );

  const sections: ChatSection[] = [
    { title: "Today", chats: [] },
    { title: "Yesterday", chats: [] },
    { title: "Previous 7 days", chats: [] },
    { title: "Older", chats: [] },
  ];

  chats.forEach((chat) => {
    const chatDate = new Date(chat.updatedAt);

    const mappedChat = {
      id: chat.id,
      title: chat.title,
      updatedAt: chat.updatedAt,
      messageCount: chat._count.messages,
    };

    if (chatDate >= today) {
      sections[0]!.chats.push(mappedChat);
    } else if (chatDate >= yesterday) {
      sections[1]!.chats.push(mappedChat);
    } else if (chatDate >= weekAgo) {
      sections[2]!.chats.push(mappedChat);
    } else {
      sections[3]!.chats.push(mappedChat);
    }
  });

  return sections.filter(
    (section) => section.chats.length > 0,
  );
}

export function ChatList() {
  const params = useParams();

  const currentChatId =
    params?.chatId as string | undefined;

  const utils = api.useUtils();

  const {
    data: chats,
    isLoading,
    error,
  } = api.chat.list.useQuery();

  const deleteChat =
    api.chat.delete.useMutation({
      onSuccess: async () => {
        await utils.chat.list.invalidate();
      },
    });

  if (isLoading) {
    return (
      <ScrollArea className="flex-1">
        <div className="space-y-2 px-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      </ScrollArea>
    );
  }

  if (error) {
    return (
      <ScrollArea className="flex-1">
        <div className="px-2 py-4 text-center text-sm text-gray-500">
          Failed to load chats
        </div>
      </ScrollArea>
    );
  }

  if (!chats?.length) {
    return (
      <ScrollArea className="flex-1">
        <div className="px-2 py-4 text-center text-sm text-gray-500">
          No chats yet. Start a new conversation!
        </div>
      </ScrollArea>
    );
  }

  const sections = groupChatsByDate(chats);

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-2 pt-3 pb-2">
              <h3 className="text-xs font-medium tracking-wider uppercase text-gray-500">
                {section.title}
              </h3>
            </div>

            {section.chats.map((chat) => (
              <div
                key={chat.id}
                className="group relative"
              >
                <Button
                  asChild
                  variant="ghost"
                  className={cn(
                    "h-auto w-full justify-start rounded-md px-3 py-2.5 pr-10 text-left font-normal",
                    "text-sm text-gray-700 transition-colors",
                    "hover:bg-blue-50 hover:text-gray-900",
                    currentChatId ===
                      chat.id &&
                      "bg-blue-50 text-gray-900 ring-1 ring-blue-200",
                  )}
                >
                  <Link href={`/chat/${chat.id}`}>
                    <div className="truncate">
                      {chat.title ??
                        "New Chat"}
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      {formatRelativeTime(
                        new Date(
                          chat.updatedAt,
                        ),
                      )}
                    </div>
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    deleteChat.mutate({
                      chatId: chat.id,
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}