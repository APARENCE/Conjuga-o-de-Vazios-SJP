import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { Button } from "./button";

// --- Contexto da Sidebar ---

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggle: () => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  // Começa fechada em mobile, aberta em desktop
  const [isOpen, setIsOpen] = React.useState(!isMobile); 

  React.useEffect(() => {
    // Se mudar para mobile, fecha. Se mudar para desktop, abre.
    setIsOpen(!isMobile);
  }, [isMobile]);

  const toggle = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const value = React.useMemo(() => ({ isOpen, setIsOpen, toggle }), [isOpen, toggle]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

// --- Componentes da Sidebar ---

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  // Adicionando largura padrão para desktop
  widthClass?: string; 
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, widthClass = "w-40", children, ...props }, ref) => {
    const { isOpen, toggle } = useSidebar();
    const isMobile = useIsMobile();

    return (
      <>
        {/* Overlay para mobile quando aberto */}
        {isMobile && isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
            onClick={toggle}
          />
        )}

        <aside
          ref={ref}
          className={cn(
            "fixed top-0 left-0 h-full flex flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out z-50",
            widthClass,
            className,
            // Desktop: sempre visível
            "hidden md:flex", 
            // Mobile: controla a visibilidade e posição
            isMobile && (isOpen ? "translate-x-0" : "-translate-x-full")
          )}
          {...props}
        >
          {children}
        </aside>
      </>
    );
  }
);
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-3 flex flex-col justify-center shrink-0", className)}
      {...props}
    />
  )
);
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4", className)}
      {...props}
    />
  )
);
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-3 shrink-0", className)}
      {...props}
    />
  )
);
SidebarFooter.displayName = "SidebarFooter";

// --- Grupos e Itens de Menu ---

const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-1", className)}
      {...props}
    />
  )
);
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1", className)}
      {...props}
    />
  )
);
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-1", className)}
      {...props}
    />
  )
);
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-0.5", className)}
      {...props}
    />
  )
);
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("w-full", className)}
      {...props}
    />
  )
);
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, children, ...props }, ref) => (
    <Button
      ref={ref}
      variant="ghost"
      className={cn(
        "w-full justify-start text-sm font-normal h-8 px-3 gap-2",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, ...props }, ref) => {
    const { toggle } = useSidebar();
    const isMobile = useIsMobile();
    
    if (!isMobile) return null; // Oculta o trigger em desktop

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        onClick={toggle}
        className={cn("h-8 w-8 shrink-0", className)}
        {...props}
      >
        <Menu className="h-4 w-4" />
      </Button>
    );
  }
);
SidebarTrigger.displayName = "SidebarTrigger";


export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
};