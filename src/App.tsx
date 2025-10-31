import { useState, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Containers from "./pages/Containers";
import Analise from "./pages/Analise";
import Inventario from "./pages/Inventario";
import Portaria from "./pages/Portaria"; // Importando a nova página
import NotFound from "./pages/NotFound";
import { Container, ContainerFile } from "@/types/container";
import { parseExcelFile, exportToExcel } from "@/lib/excelUtils";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const queryClient = new QueryClient();

// Componente Wrapper para aplicar o layout
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isOpen } = useSidebar();
  const isMobile = useIsMobile();
  
  // Largura da sidebar é 160px (w-40) = 10rem

  return (
    // O contêiner principal deve ser flexível para acomodar a sidebar fixa e o conteúdo
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
      {/* 
        A sidebar é fixa (md:fixed) e está fora do fluxo flexível.
        O AppLayout precisa compensar a largura da sidebar.
      */}
      
      {/* Conteúdo Principal (Header + Main) */}
      <div 
        className={cn(
          "flex-1 flex flex-col h-screen transition-all duration-300",
          // Em desktop (md+), a margem esquerda é controlada por 'isOpen'.
          // Se isOpen for true, a margem é 10rem (ml-40). Se for false, a margem é 0 (ml-0).
          !isMobile && (isOpen ? `md:ml-40` : "md:ml-0"),
        )}
      >
        <header className="h-12 border-b border-border bg-card flex items-center px-3 shrink-0">
          <SidebarTrigger />
        </header>
        {/* A rolagem deve estar no main, que é flex-1 */}
        <main className="flex-1 py-2 px-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};


const App = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    if (fileInputRef.current) {
      // Limpa o valor anterior para garantir que o onChange seja disparado mesmo se o mesmo arquivo for selecionado
      fileInputRef.current.value = ''; 
      fileInputRef.current.click();
    }
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
  
  // Handler unificado para edição/atualização de dados (usado pela Portaria e ContainerFormDialog)
  const handleContainerEdit = (id: string, containerData: Partial<Container>) => {
    setContainers((prev) =>
      prev.map((container) =>
        container.id === id ? { ...container, ...containerData } : container
      )
    );
    // A Portaria já exibe o toast, mas o ContainerFormDialog não.
    if (!containerData.status) { // Se não for uma atualização da Portaria (que define status)
        toast({
            title: "Container atualizado!",
            description: "Os dados do container foram salvos com sucesso.",
        });
    }
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
      files: containerData.files || [], // Inclui arquivos se houver
    };
    setContainers((prev) => [...prev, newContainer]);
    toast({
      title: "Container adicionado!",
      description: "O container foi adicionado com sucesso.",
    });
  };

  const handleContainerDelete = (id: string) => {
    setContainers((prev) => prev.filter((container) => container.id !== id));
    toast({
      title: "Container excluído!",
      description: "O container foi excluído com sucesso.",
    });
  };
  
  // Handler para Portaria: Atualiza dados e adiciona o novo arquivo (foto)
  const handlePortariaUpdate = (id: string, data: Partial<Container>) => {
    setContainers((prev) =>
      prev.map((container) => {
        if (container.id === id) {
          // Mescla os dados. Se 'files' estiver presente em 'data', ele deve ser o array COMPLETO
          // (o componente Portaria.tsx já deve ter feito a mesclagem do novo arquivo).
          return { ...container, ...data };
        }
        return container;
      })
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            {/* Renderiza a Sidebar aqui, onde os handlers estão disponíveis */}
            <AppSidebar 
              onImport={handleImport} 
              onExport={handleExport}
              onContainerAdd={handleContainerAdd}
            />
            <AppLayout>
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
                <Route 
                  path="/portaria" 
                  element={
                    <Portaria 
                      containers={containers} 
                      onContainerUpdate={handlePortariaUpdate}
                      onContainerAdd={handleContainerAdd} // Passando o handler de adição para novos containers
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
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;