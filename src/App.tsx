import { useRef, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Containers from "./pages/Containers";
import ContainersCheios from "./pages/ContainersCheios"; // Novo
import Analise from "./pages/Analise";
import AnaliseCheios from "./pages/AnaliseCheios"; // Novo
import Inventario from "./pages/Inventario";
import InventarioCheios from "./pages/InventarioCheios"; // Novo
import Portaria from "./pages/Portaria";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import { Container, ContainerFile } from "@/types/container";
import { parseExcelFile, exportToExcel } from "@/lib/excelUtils";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileOperation } from "@/hooks/use-file-operation";
import { useContainers } from "@/hooks/use-containers";
import { useFullContainers } from "@/hooks/use-full-containers"; // Novo hook
import { SessionProvider, useSession } from "@/hooks/use-session";

const queryClient = new QueryClient();

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
        {/* O main agora é flex-1 e overflow-y-auto para permitir a rolagem do conteúdo da página */}
        <main className="flex-1 overflow-y-auto">
          {/* O conteúdo da página (Containers.tsx, etc.) deve ser flex-col h-full para que o layout interno funcione */}
          {children}
        </main>
      </div>
    </div>
  );
};

const MainApp = () => {
  // Containers Vazios
  const { 
    containers: emptyContainers, 
    isLoading: isLoadingEmpty, 
    addContainer: addEmptyContainer, 
    updateContainer: updateEmptyContainer, 
    deleteContainer: deleteEmptyContainer,
    addMultipleContainers: addMultipleEmptyContainers
  } = useContainers();
  
  // Containers Cheios
  const { 
    containers: fullContainers, 
    isLoading: isLoadingFull, 
    addContainer: addFullContainer, 
    updateContainer: updateFullContainer, 
    deleteContainer: deleteFullContainer,
    addMultipleContainers: addMultipleFullContainers
  } = useFullContainers();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'vazio' | 'cheio'>('vazio');

  const handleImportFile = async (file: File) => {
    const sheetNameHint = importType === 'vazio' ? 'ESTOQUE VAZIO' : 'ESTOQUE CHEIO';
    const data = await parseExcelFile(file, sheetNameHint);
    
    if (data && data.length > 0) {
      if (importType === 'vazio') {
        await addMultipleEmptyContainers(data);
      } else {
        await addMultipleFullContainers(data);
      }
    } else {
      throw new Error(`Nenhum dado de container válido foi encontrado no arquivo na aba '${sheetNameHint}'.`);
    }
  };

  const { execute: executeImport, isLoading: isImporting } = useFileOperation(
    handleImportFile,
    {
      loadingMessage: `Importando planilha (${importType === 'vazio' ? 'Vazios' : 'Cheios'})... Isso pode levar alguns segundos.`,
      successMessage: "Importação concluída com sucesso!",
      errorMessage: "Erro na importação. Verifique o formato do arquivo e os dados.",
    }
  );

  const handleExportFile = async (type: 'vazio' | 'cheio') => {
    const containersToExport = type === 'vazio' ? emptyContainers : fullContainers;
    if (containersToExport.length === 0) {
      throw new Error("Nenhum dado para exportar.");
    }
    exportToExcel(containersToExport);
  };

  const { execute: executeExport, isLoading: isExporting } = useFileOperation(
    handleExportFile,
    {
      loadingMessage: "Exportando dados para Excel...",
      successMessage: "Exportação concluída! O arquivo foi baixado.",
      errorMessage: "Erro na exportação. Tente novamente.",
    }
  );

  const handleImport = (type: 'vazio' | 'cheio') => {
    setImportType(type);
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

  const handleExport = async (type: 'vazio' | 'cheio') => {
    try {
      await executeExport(type);
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

  // Funções de CRUD unificadas
  const handleContainerUpdateFiles = async (containerId: string, files: ContainerFile[], type: 'vazio' | 'cheio') => {
    const updateFn = type === 'vazio' ? updateEmptyContainer : updateFullContainer;
    await updateFn({ id: containerId, data: { files } });
    toast({
        title: "Arquivos atualizados!",
        description: "Os anexos do container foram salvos com sucesso.",
    });
  };
  
  const handleContainerEdit = async (id: string, containerData: Partial<Container>, type: 'vazio' | 'cheio') => {
    const updateFn = type === 'vazio' ? updateEmptyContainer : updateFullContainer;
    await updateFn({ id, data: containerData });
  };

  const handleContainerAdd = async (containerData: Partial<Container>, type: 'vazio' | 'cheio') => {
    const addFn = type === 'vazio' ? addEmptyContainer : addFullContainer;
    await addFn(containerData);
  };

  const handleContainerDelete = async (id: string, type: 'vazio' | 'cheio') => {
    const deleteFn = type === 'vazio' ? deleteEmptyContainer : deleteFullContainer;
    await deleteFn(id);
  };
  
  const handlePortariaUpdate = async (id: string, data: Partial<Container>) => {
    // A portaria assume containers vazios por padrão
    await updateEmptyContainer({ id, data });
  };

  const handlePortariaAdd = async (containerData: Partial<Container>) => {
    // Containers adicionados pela portaria são considerados vazios por padrão (Entrada)
    await addEmptyContainer(containerData);
  };

  const isLoading = isLoadingEmpty || isLoadingFull;

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
          {/* Containers Vazios */}
          <Route 
            path="/" 
            element={
              <Containers 
                containers={emptyContainers} 
                onContainerUpdate={(id, files) => handleContainerUpdateFiles(id, files, 'vazio')}
                onContainerAdd={(data) => handleContainerAdd(data, 'vazio')}
                onContainerEdit={(id, data) => handleContainerEdit(id, data, 'vazio')}
                onContainerDelete={(id) => handleContainerDelete(id, 'vazio')}
              />
            } 
          />
          <Route path="/analise" element={<Analise containers={emptyContainers} />} />
          <Route 
            path="/inventario" 
            element={
              <Inventario 
                containers={emptyContainers} 
              />
            } 
          />
          
          {/* Containers Cheios */}
          <Route 
            path="/cheios" 
            element={
              <ContainersCheios 
                containers={fullContainers} 
                onContainerUpdate={(id, files) => handleContainerUpdateFiles(id, files, 'cheio')}
                onContainerAdd={(data) => handleContainerAdd(data, 'cheio')}
                onContainerEdit={(id, data) => handleContainerEdit(id, data, 'cheio')}
                onContainerDelete={(id) => handleContainerDelete(id, 'cheio')}
              />
            } 
          />
          <Route path="/analise-cheios" element={<AnaliseCheios containers={fullContainers} />} />
          <Route 
            path="/inventario-cheios" 
            element={
              <InventarioCheios 
                containers={fullContainers} 
              />
            } 
          />

          {/* Portaria (Assume Vazios) */}
          <Route 
            path="/portaria" 
            element={
              <Portaria 
                containers={emptyContainers} 
                onContainerUpdate={handlePortariaUpdate}
                onContainerAdd={handlePortariaAdd}
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

const AppContent = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/*" 
        element={session ? <MainApp /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  );
};

const App = () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionProvider>
            <SidebarProvider>
              <AppContent />
            </SidebarProvider>
          </SessionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
);

export default App;