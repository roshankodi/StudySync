"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <div className="h-4 w-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
        <span className="sr-only">Loading theme toggle</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 cursor-pointer p-0 transition-all duration-300 ease-out hover:scale-105 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Sun className="h-4 w-4 scale-100 rotate-0 transition-all duration-300 ease-in-out dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all duration-300 ease-in-out dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="animate-in fade-in-0 zoom-in-98 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-98 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 w-40 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:duration-500 data-[state=closed]:ease-[cubic-bezier(0.4,0,0.2,1)]"
        sideOffset={8}
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-1 hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
        >
          <Sun className="mr-2 h-4 w-4 transition-transform duration-300 ease-out hover:rotate-12" />
          <span className="cursor-pointer">Light</span>
          {theme === "light" && (
            <div className="ml-auto h-2 w-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-1 hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
        >
          <Moon className="mr-2 h-4 w-4 transition-transform duration-300 ease-out hover:-rotate-12" />
          <span className="cursor-pointer">Dark</span>
          {theme === "dark" && (
            <div className="ml-auto h-2 w-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-1 hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
        >
          <Monitor className="mr-2 h-4 w-4 transition-transform duration-300 ease-out hover:scale-110" />
          <span className="cursor-pointer">System</span>
          {theme === "system" && (
            <div className="ml-auto h-2 w-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
