import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { FileText, History, LayoutDashboard, Shield, Palette } from "lucide-react";

export const AppSidebar = () => {
  const { company } = useAuth();
  const location = useLocation();

  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { title: "Nova Ata", icon: FileText, path: "/nova-ata" },
    { title: "Histórico", icon: History, path: "/historico" },
    { title: "Suporte", icon: LifeBuoy, path: "/suporte" },
  ];

  const adminMenuItems = [
    { title: "Painel Admin", icon: Shield, path: "/admin" },
    { title: "Códigos", icon: KeyRound, path: "/admin/codigos-empresa" },
    { title: "Empresas", icon: Building2, path: "/admin/empresas" },
    { title: "Utilizadores", icon: Users, path: "/admin/utilizadores" },
    { title: "Tickets", icon: HelpCircle, path: "/admin/tickets" },
    { title: "Templates", icon: FileText, path: "/admin/templates" },
    { title: "Formatação", icon: Palette, path: "/admin/formatacao" },
    { title: "Preços", icon: Tag, path: "/admin/precos" },
    { title: "Pagamentos", icon: Wallet, path: "/admin/pagamentos" },
  ];

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
              {company?.name || "Empresa"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
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

        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
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
    </Sidebar>
  );
};
