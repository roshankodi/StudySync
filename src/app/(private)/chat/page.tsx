"use client";

import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChatComponent } from "@/components/chat/chat-component";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ChatPage() {
  const router = useRouter();

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* Header with sidebar trigger */}
      <header className="border-border bg-card flex h-12 items-center border-b px-3">
        <SidebarTrigger className="cursor-pointer" />

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
      <div className="flex flex-1 flex-col">
        <ChatComponent />
      </div>
    </div>
  );
}
