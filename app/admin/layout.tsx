import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminNavMain } from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {/* Sidebar header — logo */}
        <SidebarHeader className="h-14 justify-center border-b px-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="size-5 shrink-0" />
            <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
              Kamek Plus
            </span>
          </div>
        </SidebarHeader>

        {/* Nav items */}
        <SidebarContent>
          <AdminNavMain />
        </SidebarContent>

        {/* User footer */}
        <SidebarFooter className="border-t p-3">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-full"
              />
            )}
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium leading-none">
                {session.user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground mt-0.5">
                {session.user.email}
              </p>
            </div>
          </div>
          <form
            className="mt-2 group-data-[collapsible=icon]:hidden"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full"
            >
              Sign out
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>

      {/* Page content */}
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <span className="text-sm font-medium text-muted-foreground">
            Admin
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
