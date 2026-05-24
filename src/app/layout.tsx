import "@/styles/globals.css";

import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";

import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "StudySync",
  description: "Your AI Research Assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <TRPCReactProvider>
              {children}
            </TRPCReactProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}