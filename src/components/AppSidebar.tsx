import { Home, BarChart3, Upload, Download, PackageOpen, Plus, Truck } from "lucide-react";
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
    { title: "Portaria", url: "/portaria", icon: Truck }, // Novo item de menu
    { title: "Análise", url: "/analise", icon: BarChart3 },
    { title: "Inventário", url: "/inventario", icon: PackageOpen },
  ];

  return (
    <Sidebar className="border-r border-border w-44">
      <SidebarHeader className="border-b border-border p-3">
        <h2 className="text-sm font-bold text-primary">Conjugação de vazios</h2>
        <p className="text-xs text-muted-foreground">Patio- SJP</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-8 px-2">
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium text-xs"
                          : "hover:bg-muted/50 text-xs"
                      }
                    >
                      <item.icon className="h-3 w-3" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs">Ações</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1 px-2">
            <ContainerFormDialog 
              onSave={onContainerAdd} 
              trigger={
                <Button
                  variant="default"
                  size="sm"
                  className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground h-7 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Novo Container
                </Button>
              }
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start h-7 px-2 text-xs"
              onClick={onImport}
            >
              <Upload className="h-3 w-3 mr-1" />
              Importar Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start h-7 px-2 text-xs"
              onClick={onExport}
            >
              <Download className="h-3 w-3 mr-1" />
              Exportar Excel
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <p className="text-xs text-muted-foreground">v1.0.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}