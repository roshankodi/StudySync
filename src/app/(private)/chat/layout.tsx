import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/sidebar/chat-sidebar";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <SidebarProvider>
      <ChatSidebar user={session.user} />
      <SidebarInset className="flex flex-1 flex-col">{children}</SidebarInset>
    </SidebarProvider>
  );
}
