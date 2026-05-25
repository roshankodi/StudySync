"use client";

import Link from "next/link";
import { Plus, GraduationCap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ChatList } from "./chat-list";
import { UserMenu } from "./user-menu";

interface ChatSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function ChatSidebar({ user }: ChatSidebarProps) {
  return (
    <Sidebar
      collapsible="icon"
      className="w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
    >
      <SidebarHeader className="p-6 pb-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center space-x-3 group-data-[collapsible=icon]:space-x-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
              <GraduationCap className="h-4 w-4 text-white group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
            </div>
            <span className="text-base font-bold text-gray-900 group-data-[collapsible=icon]:hidden dark:text-white">
              StudySync
            </span>
          </div>
          <div className="group-data-[collapsible=icon]:hidden"></div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 group-data-[collapsible=icon]:px-2">
        <div className="mb-6 group-data-[collapsible=icon]:mb-4">
          <Button
            asChild
            className="w-full justify-start gap-2 rounded-lg bg-blue-600 px-4 py-4 text-sm text-white transition-all group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            size="sm"
          >
            <Link
              href="/chat"
              className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center"
            >
              <Plus className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
              <span className="group-data-[collapsible=icon]:hidden">
                New Chat
              </span>
            </Link>
          </Button>
        </div>

        <div className="flex-1 group-data-[collapsible=icon]:hidden">
          <ChatList />
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 px-3 py-2 group-data-[collapsible=icon]:p-2 dark:border-gray-800">
        <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <UserMenu user={user} />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
