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
import { FileText, History, LayoutDashboard, Shield, Palette, FolderOpen } from "lucide-react";
import logoAsset from "@/assets/atasia-logo.png.asset.json";

export const AppSidebar = () => {
  const { company } = useAuth();
  const location = useLocation();

  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { title: "Assembleias", icon: FolderOpen, path: "/assembleias" },
    { title: "Nova Ata", icon: FileText, path: "/nova-ata" },
    { title: "Histórico", icon: History, path: "/historico" },
    { title: "Templates", icon: FileText, path: "/templates" },
    { title: "Formatação", icon: Palette, path: "/formatacao" },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="Logótipo AtasIA"
            className="h-10 w-10 shrink-0 object-contain"
          />
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
      </SidebarContent>
    </Sidebar>
  );
};
