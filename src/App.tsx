import { useState, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Containers from "./pages/Containers";
import Analise from "./pages/Analise";
import Inventario from "./pages/Inventario";
import Portaria from "./pages/Portaria";
import NotFound from "./pages/NotFound";
import { Container, ContainerFile } from "@/types/container";
import { parseExcelFile, exportToExcel } from "@/lib/excelUtils";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileOperation } from "@/hooks/use-file-operation";
import { useContainers } from "@/hooks/use-containers";

const queryClient = new QueryClient();

// Componente Wrapper para aplicar o layout
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isOpen, setIsOpen } = useSidebar();
  const isMobile = useIsMobile();
  
  const CustomSidebarTrigger = () => {
    if (isMobile || !isOpen) {
      return (
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "h-8 w-8",
            !isMobile && isOpen && "hidden" 
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
      <div 
        className={cn(
          "flex-1 flex flex-col h-screen transition-all duration-300",
          !isMobile && (isOpen ? `md:ml-40` : "md:ml-0"),
        )}
      >
        <header className="h-12 border-b border-border bg-card flex items-center px-3 shrink-0">
          <CustomSidebarTrigger />
        </header>
        <main className="flex-1 py-2 px-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};


const AppContent = () => {
  const { 
    containers, 
    isLoading, 
    addContainer, 
    updateContainer, 
    deleteContainer,
    addMultipleContainers // Importando a nova função
  } = useContainers();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers de Importação/Exportação com a nova lógica ---

  const handleImportFile = async (file: File) => {
    const data = await parseExcelFile(file);
    if (data && data.length > 0) {
      await addMultipleContainers(data); // Usando a nova função de importação em massa
    } else {
      throw new Error("Nenhum dado de container válido foi encontrado no arquivo.");
    }
  };

  const { execute: executeImport, isLoading: isImporting } = useFileOperation(
    handleImportFile,
    {
      loadingMessage: "Importando planilha... Isso pode levar alguns segundos.",
      successMessage: "Importação concluída com sucesso!",
      errorMessage: "Erro na importação. Verifique o formato do arquivo e os dados.",
    }
  );

  const { execute: executeExport, isLoading: isExporting } = useFileOperation(
    async () => {
      if (containers.length === 0) {
        throw new Error("Nenhum dado para exportar.");
      }
      exportToExcel(containers);
    },
    {
      loadingMessage: "Exportando dados para Excel...",
      successMessage: "Exportação concluída! O arquivo foi baixado.",
      errorMessage: "Erro na exportação. Tente novamente.",
    }
  );

  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; 
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await executeImport(file);
  };

  const handleExport = async () => {
    try {
      await executeExport();
    } catch (error) {
      if (error instanceof Error && error.message.includes("Nenhum dado")) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Importe uma planilha primeiro.",
          variant: "destructive",
        });
      }
    }
  };

  // --- Handlers de Container (sem alterações) ---

  const handleContainerUpdateFiles = async (containerId: string, files: ContainerFile[]) => {
    await updateContainer({ id: containerId, data: { files } });
    toast({
        title: "Arquivos atualizados!",
        description: "Os anexos do container foram salvos com sucesso.",
    });
  };
  
  const handleContainerEdit = async (id: string, containerData: Partial<Container>) => {
    await updateContainer({ id, data: containerData });
  };

  const handleContainerAdd = async (containerData: Partial<Container>) => {
    await addContainer(containerData);
  };

  const handleContainerDelete = async (id: string) => {
    await deleteContainer(id);
  };
  
  const handlePortariaUpdate = async (id: string, data: Partial<Container>) => {
    await updateContainer({ id, data });
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-lg text-primary">Carregando dados...</p>
        </div>
    );
  }

  return (
    <>
      <AppSidebar 
        onImport={handleImport} 
        onExport={handleExport}
        onContainerAdd={handleContainerAdd}
        isImporting={isImporting}
        isExporting={isExporting}
      />
      <AppLayout>
        <Routes>
          <Route 
            path="/" 
            element={
              <Containers 
                containers={containers} 
                onContainerUpdate={handleContainerUpdateFiles}
                onContainerAdd={handleContainerAdd}
                onContainerEdit={handleContainerEdit}
                onContainerDelete={handleContainerDelete}
              />
            } 
          />
          <Route path="/analise" element={<Analise containers={containers} />} />
          <Route 
            path="/inventario" 
            element={
              <Inventario 
                containers={containers} 
              />
            } 
          />
          <Route 
            path="/portaria" 
            element={
              <Portaria 
                containers={containers} 
                onContainerUpdate={handlePortariaUpdate}
                onContainerAdd={handleContainerAdd}
              />
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
};

const App = () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <AppContent />
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
);

export default App;