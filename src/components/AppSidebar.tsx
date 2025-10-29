import { Home, BarChart3, Upload, Download, PackageOpen, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ContainerFormDialog } from "./ContainerFormDialog";
import { Container } from "@/types/container";

interface AppSidebarProps {
  onImport: () => void;
  onExport: () => void;
  onContainerAdd: (container: Partial<Container>) => void;
}

export function AppSidebar({ onImport, onExport, onContainerAdd }: AppSidebarProps) {
  const menuItems = [
    { title: "Containers", url: "/", icon: Home },
    { title: "Análise", url: "/analise", icon: BarChart3 },
    { title: "Inventário", url: "/inventario", icon: PackageOpen },
  ];

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <h2 className="text-xl font-extrabold text-sidebar-primary tracking-tight">CAS System</h2>
        <p className="text-xs text-sidebar-foreground/70">Gestão de Containers</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Ações
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2 px-2">
            <ContainerFormDialog 
              onSave={onContainerAdd} 
              trigger={
                <Button
                  variant="default"
                  size="sm"
                  className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Container
                </Button>
              }
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start bg-sidebar-background hover:bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground"
              onClick={onImport}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start bg-sidebar-background hover:bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <p className="text-xs text-sidebar-foreground/50">v1.0.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}