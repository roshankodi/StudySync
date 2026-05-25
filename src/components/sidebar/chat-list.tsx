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
  }>
): ChatSection[] {
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const yesterday = new Date(
    today.getTime() - 24 * 60 * 60 * 1000
  );

  const weekAgo = new Date(
    today.getTime() - 7 * 24 * 60 * 60 * 1000
  );

  const sections: Record<string, ChatSection> = {
    today: { title: "Today", chats: [] },
    yesterday: { title: "Yesterday", chats: [] },
    week: { title: "Previous 7 days", chats: [] },
    older: { title: "Older", chats: [] },
  };

  chats.forEach((chat) => {
    const chatDate = new Date(chat.updatedAt);

    const mappedChat = {
      id: chat.id,
      title: chat.title,
      updatedAt: chat.updatedAt,
      messageCount: chat._count.messages,
    };

    if (chatDate >= today) {
      sections.today.chats.push(mappedChat);
    } else if (chatDate >= yesterday) {
      sections.yesterday.chats.push(mappedChat);
    } else if (chatDate >= weekAgo) {
      sections.week.chats.push(mappedChat);
    } else {
      sections.older.chats.push(mappedChat);
    }
  });

  return Object.values(sections).filter(
    (section) => section.chats.length > 0
  );
}

export function ChatList() {
  const params = useParams();
  const currentChatId = params?.chatId as string | undefined;

  const { data: chats, isLoading, error } =
    api.chat.list.useQuery();

  const utils = api.useUtils();

  const deleteChat = api.chat.delete.useMutation({
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
        <div className="px-2 py-4 text-center text-sm">
          Failed to load chats
        </div>
      </ScrollArea>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <ScrollArea className="flex-1">
        <div className="px-2 py-4 text-center text-sm">
          No chats yet
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
              <h3 className="text-xs font-medium uppercase text-gray-500">
                {section.title}
              </h3>
            </div>

            {section.chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group flex items-center justify-between rounded-md px-2 hover:bg-blue-50",
                  currentChatId === chat.id &&
                    "bg-blue-50"
                )}
              >
                <Button
                  asChild
                  variant="ghost"
                  className="flex-1 justify-start text-left"
                >
                  <Link href={`/chat/${chat.id}`}>
                    <div>
                      <div className="truncate">
                        {chat.title ?? "New Chat"}
                      </div>

                      <div className="text-xs text-gray-500">
                        {formatRelativeTime(
                          new Date(chat.updatedAt)
                        )}
                      </div>
                    </div>
                  </Link>
                </Button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    deleteChat.mutate({
                      id: chat.id,
                    });
                  }}
                  className="opacity-0 transition-opacity group-hover:opacity-100 p-2 hover:text-red-500"
                >
                  <Trash2 size={16}/>
                </button>

              </div>
            ))}

          </div>
        ))}

      </div>
    </ScrollArea>
  );
}