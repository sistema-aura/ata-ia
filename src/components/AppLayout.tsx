import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-6">
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-auto bg-paper">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
