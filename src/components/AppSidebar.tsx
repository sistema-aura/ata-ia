import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { FileText, History, LifeBuoy, LogOut, LayoutDashboard, Building2, Users, Shield, CreditCard, HelpCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AppSidebar = () => {
  const { isAdmin, company, profile, signOut } = useAuth();
  const location = useLocation();

  const companyMenuItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { title: "Nova Ata", icon: FileText, path: "/nova-ata" },
    { title: "Histórico", icon: History, path: "/historico" },
    { title: "Suporte", icon: LifeBuoy, path: "/suporte" },
  ];

  const adminMenuItems = [
    { title: "Painel Admin", icon: Shield, path: "/admin" },
    { title: "Empresas", icon: Building2, path: "/admin/empresas" },
    { title: "Utilizadores", icon: Users, path: "/admin/utilizadores" },
    { title: "Tickets", icon: HelpCircle, path: "/admin/tickets" },
    { title: "Templates", icon: FileText, path: "/admin/templates" },
    { title: "Pagamentos", icon: Wallet, path: "/admin/pagamentos" },
  ];

  const menuItems = isAdmin ? adminMenuItems : companyMenuItems;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-bold text-foreground leading-tight">
              Atas<span className="text-gradient-gold">IA</span>
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {isAdmin ? "Administração" : company?.name || profile?.email}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isAdmin ? "Administração" : "Menu"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.path}>
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
