import { Home, BarChart3, Upload, Download, PackageOpen, Plus, Truck, ChevronLeft, ChevronRight, Loader2, LogOut } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ContainerFormDialog } from "./ContainerFormDialog";
import { Container } from "@/types/container";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface AppSidebarProps {
  onImport: (type: 'vazio' | 'cheio') => void; // Atualizado para aceitar tipo
  onExport: (type: 'vazio' | 'cheio') => void; // Atualizado para aceitar tipo
  onContainerAdd: (container: Partial<Container>, type: 'vazio' | 'cheio') => void; // Atualizado para aceitar tipo
  isImporting: boolean;
  isExporting: boolean;
}

export function AppSidebar({ onImport, onExport, onContainerAdd, isImporting, isExporting }: AppSidebarProps) {
  const { isOpen, setIsOpen } = useSidebar();
  const isMobile = useIsMobile();
  
  const handleNavigationClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = [
    { title: "Containers-Vazios", url: "/", icon: Home },
    { title: "Containers-Cheios", url: "/cheios", icon: PackageOpen }, // Novo item
    { title: "Gate", url: "/portaria", icon: Truck },
    { title: "Análise Vazios", url: "/analise", icon: BarChart3 },
    { title: "Análise Cheios", url: "/analise-cheios", icon: BarChart3 }, // Novo item
    { title: "Inventário Vazios", url: "/inventario", icon: PackageOpen },
    { title: "Inventário Cheios", url: "/inventario-cheios", icon: PackageOpen }, // Novo item
  ];

  const handleToggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Sidebar 
      className={cn(
        "border-r border-border w-40 transition-transform duration-300 ease-in-out",
        "md:fixed md:top-0 md:left-0 md:h-full md:z-50",
        !isMobile && !isOpen && "-translate-x-40",
        !isMobile && isOpen && "translate-x-0"
      )}
    >
      <SidebarHeader className="border-b border-border p-1">
        <h2 className="text-sm font-bold text-primary break-words leading-tight">Controle de Patio SJP</h2>
        <p className="text-xs text-muted-foreground">TLOG</p>
      </SidebarHeader>

      <SidebarContent className="p-1 flex flex-col justify-between">
        <div>
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs px-2">Navegação</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-7 px-2">
                      <NavLink
                        to={item.url}
                        onClick={handleNavigationClick}
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
            <SidebarGroupLabel className="text-xs px-2">Ações</SidebarGroupLabel>
            <SidebarGroupContent className="space-y-1 px-1">
              <ContainerFormDialog 
                onSave={(data) => onContainerAdd(data, 'vazio')} 
                trigger={
                  <Button
                    variant="ghost" // Alterado para ghost
                    size="sm"
                    className="w-full justify-start hover:bg-primary/10 hover:text-primary text-foreground h-7 px-1 text-xs" // Estilo ajustado para ser 'luminoso' no hover
                    disabled={isImporting || isExporting}
                  >
                    <Plus className="h-3 w-3" /> 
                    Novo Container
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-7 px-1 text-xs"
                onClick={() => onImport('vazio')}
                disabled={isImporting || isExporting}
              >
                {isImporting ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3 mr-1" />
                )}
                Importar Vazios
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-7 px-1 text-xs"
                onClick={() => onImport('cheio')}
                disabled={isImporting || isExporting}
              >
                {isImporting ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3 mr-1" />
                )}
                Importar Cheios
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-7 px-1 text-xs"
                onClick={() => onExport('vazio')}
                disabled={isImporting || isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Exportar Excel
              </Button>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs px-2">Conta</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1 px-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-7 px-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-3 w-3 mr-1" />
              Sair
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-1 flex justify-between items-center">
        <p className="text-xs text-muted-foreground">v1.0.0</p>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 hidden md:flex"
              onClick={handleToggleSidebar}
            >
              {isOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isOpen ? "Ocultar Sidebar" : "Mostrar Sidebar"}
          </TooltipContent>
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}