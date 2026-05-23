"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChatComponent } from "@/components/chat/chat-component";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ChatPageProps {
  params: Promise<{ chatId: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header with sidebar trigger */}
      <header className="flex h-12 items-center border-b px-3">
        <SidebarTrigger />
        <div className="ml-2">
          <h1 className="text-base font-medium">Chat</h1>
        </div>

        <div className="ml-auto flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatComponent chatId={resolvedParams.chatId} />
      </div>
    </div>
  );
}
