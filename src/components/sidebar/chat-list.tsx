"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useParams } from "next/navigation";

import { api } from "@/trpc/react";

export function ChatList() {
  const utils = api.useUtils();

  const params = useParams();

  const currentChatId = params?.chatId as string;

  const { data: chats, isLoading } = api.chat.list.useQuery();

  const deleteChat = api.chat.delete.useMutation({
    onSuccess: async () => {
      await utils.chat.list.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    );
  }

  if (!chats?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No chats yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {chats.map((chat) => {
        const isActive = currentChatId === chat.id;

        return (
          <div
            key={chat.id}
            className={`
              group
              flex
              items-center
              justify-between
              rounded-lg
              border
              px-3
              py-2
              transition-all
              hover:bg-accent
              ${
                isActive
                  ? "bg-accent border-primary"
                  : "border-transparent"
              }
            `}
          >
            <Link
              href={`/chat/${chat.id}`}
              className="flex-1 truncate text-sm font-medium"
            >
              {chat.title ?? "New Chat"}
            </Link>

            <button
              onClick={() => {
                deleteChat.mutate({
                  id: chat.id,
                });
              }}
              className="
                ml-2
                rounded-md
                p-2
                text-gray-400
                transition-all
                hover:bg-red-100
                hover:text-red-500
              "
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}