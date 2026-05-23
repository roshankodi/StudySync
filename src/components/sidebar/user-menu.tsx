"use client";

import { LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const comingSoon = (feature: string) => {
    toast("Coming soon", {
      description: `${feature} feature is not implemented yet.`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative h-auto w-full justify-start py-2.5 pr-7 pl-2 text-left font-normal",
            "rounded-md text-sm text-gray-700 transition-colors duration-150",
            "hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 dark:text-gray-300 dark:hover:bg-blue-950/50 dark:hover:ring-blue-800",
            "data-[state=open]:bg-blue-50 data-[state=open]:text-gray-900 data-[state=open]:ring-1 data-[state=open]:ring-blue-200",
            "dark:data-[state=open]:bg-blue-950/50 dark:data-[state=open]:text-white dark:data-[state=open]:ring-blue-800",
            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pr-2",
            "focus-visible:ring-2 focus-visible:ring-blue-400/40 focus-visible:outline-none",
          )}
        >
          <div className="flex items-center space-x-3 group-data-[collapsible=icon]:space-x-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
              <AvatarFallback className="bg-gray-200 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left group-data-[collapsible=icon]:hidden">
              <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {user.name ?? "User"}
              </div>
              <div className="truncate text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                {user.email}
              </div>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      >
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            comingSoon("Profile");
          }}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            comingSoon("Settings");
          }}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="/api/auth/signout"
            className="flex cursor-pointer items-center text-red-600 dark:text-red-400"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
