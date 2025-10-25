import { useState, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Containers from "./pages/Containers";
import Analise from "./pages/Analise";
import Inventario from "./pages/Inventario";
import NotFound from "./pages/NotFound";
import { Container, ContainerFile } from "@/types/container";
import { parseExcelFile, exportToExcel } from "@/lib/excelUtils";
import { toast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

const App = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  // O estado 'inventory' e seus handlers foram removidos, pois o inventário agora é derivado dos containers.
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      setContainers(data);
      toast({
        title: "Importação concluída!",
        description: `${data.length} containers foram importados com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar o arquivo. Verifique o formato.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (containers.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Importe uma planilha primeiro.",
        variant: "destructive",
      });
      return;
    }

    try {
      exportToExcel(containers);
      toast({
        title: "Exportação concluída!",
        description: "O arquivo Excel foi baixado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o arquivo.",
        variant: "destructive",
      });
    }
  };

  const handleContainerUpdate = (containerId: string, files: ContainerFile[]) => {
    setContainers((prev) =>
      prev.map((container) =>
        container.id === containerId ? { ...container, files } : container
      )
    );
  };

  const handleContainerAdd = (containerData: Partial<Container>) => {
    const newContainer: Container = {
      id: `container-${Date.now()}`,
      container: containerData.container || "",
      armador: containerData.armador || "",
      dataOperacao: containerData.dataOperacao || "",
      dataPorto: containerData.dataPorto || "",
      demurrage: containerData.demurrage || "",
      freeTime: containerData.freeTime || 0,
      diasRestantes: containerData.diasRestantes || 0,
      placas: containerData.placas || "",
      motorista: containerData.motorista || "",
      origem: containerData.origem || "",
      baixaPatio: containerData.baixaPatio || "",
      containerTroca: containerData.containerTroca || "",
      armadorTroca: containerData.armadorTroca || "",
      depotDevolucao: containerData.depotDevolucao || "",
      dataDevolucao: containerData.dataDevolucao || "",
      status: containerData.status || "",
      files: [],
    };
    setContainers((prev) => [...prev, newContainer]);
    toast({
      title: "Container adicionado!",
      description: "O container foi adicionado com sucesso.",
    });
  };

  const handleContainerEdit = (id: string, containerData: Partial<Container>) => {
    setContainers((prev) =>
      prev.map((container) =>
        container.id === id ? { ...container, ...containerData } : container
      )
    );
    toast({
      title: "Container atualizado!",
      description: "O container foi atualizado com sucesso.",
    });
  };

  const handleContainerDelete = (id: string) => {
    setContainers((prev) => prev.filter((container) => container.id !== id));
    toast({
      title: "Container excluído!",
      description: "O container foi excluído com sucesso.",
    });
  };
  
  // --- Inventory Handlers REMOVED ---
  // Os handlers de inventário foram removidos, pois o inventário agora é derivado.
  // --------------------------

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full bg-background">
              <AppSidebar onImport={handleImport} onExport={handleExport} />
              <div className="flex-1 flex flex-col">
                <header className="h-14 border-b border-border bg-card flex items-center px-4">
                  <SidebarTrigger />
                </header>
                <main className="flex-1 p-6 overflow-auto">
                  <Routes>
                    <Route 
                      path="/" 
                      element={
                        <Containers 
                          containers={containers} 
                          onContainerUpdate={handleContainerUpdate}
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
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;