"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { AppToaster } from "@/components/ui/toaster";

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <TRPCReactProvider>
          {children}
          <AppToaster />
        </TRPCReactProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}