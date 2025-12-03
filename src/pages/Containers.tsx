import { useState, useMemo, useEffect } from "react";
import { Container, ContainerFile } from "@/types/container";
import { ContainerTable } from "@/components/ContainerTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContainerFormDialog } from "@/components/ContainerFormDialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ContainerDetailsSidebar } from "@/components/ContainerDetailsSidebar";
import { formatDateToBR } from "@/lib/excelUtils";
import { toast } from "@/hooks/use-toast";
import { ContainerHeader } from "@/components/ContainerHeader";
import { isContainerDevolvido } from "@/lib/containerUtils"; // Importando a nova função

interface ContainersPageProps {
  containers: Container[];
  onContainerUpdate: (containerId: string, files: ContainerFile[]) => Promise<void>;
  onContainerAdd: (container: Partial<Container>) => Promise<void>;
  onContainerEdit: (id: string, container: Partial<Container>) => Promise<void>;
  onContainerDelete: (id: string) => Promise<void>;
}

export default function Containers({ 
  containers, 
  onContainerUpdate, 
  onContainerAdd, 
  onContainerEdit, 
  onContainerDelete 
}: ContainersPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); 
  const [armadorFilter, setArmadorFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  const allArmadores = useMemo(() => {
    const uniqueArmadores = [...new Set(containers.map(c => c.armador).filter(Boolean))];
    return uniqueArmadores.sort();
  }, [containers]);

  const getDiasRestantes = (c: Container) => typeof c.prazoDias === 'number' ? c.prazoDias : 0;

  const filteredContainers = useMemo(() => {
    return containers.filter(c => {
      const search = searchTerm.toLowerCase().trim();
      
      const matchesSearch = !search || 
        c.container.toLowerCase().includes(search) ||
        c.armador.toLowerCase().includes(search) ||
        c.motoristaEntrada?.toLowerCase().includes(search) ||
        c.placa?.toLowerCase().includes(search) ||
        c.clienteEntrada?.toLowerCase().includes(search) ||
        c.clienteSaidaDestino?.toLowerCase().includes(search) ||
        c.bookingAtrelado?.toLowerCase().includes(search);

      let matchesStatus = true;
      const dias = getDiasRestantes(c);
      
      if (statusFilter === "devolvidos") {
        matchesStatus = isContainerDevolvido(c); // Usando a nova função
      } else if (statusFilter === "pendentes") {
        // Pendentes são aqueles que não foram devolvidos E não estão vencidos
        matchesStatus = !isContainerDevolvido(c) && dias > 0; 
      } else if (statusFilter === "vencidos") {
        matchesStatus = dias === 0 && !isContainerDevolvido(c); // Vencido E não devolvido
      } else if (statusFilter === "proximos") {
        matchesStatus = dias > 0 && dias <= 3 && !isContainerDevolvido(c); // Próximo E não devolvido
      }

      const matchesArmador = armadorFilter === "all" || c.armador === armadorFilter;

      return matchesSearch && matchesStatus && matchesArmador;
    });
  }, [containers, searchTerm, statusFilter, armadorFilter]);

  useEffect(() => {
    const search = searchTerm.toLowerCase().trim();
    
    if (search && filteredContainers.length === 1) {
      const uniqueContainer = filteredContainers[0];
      
      if (uniqueContainer.container.toLowerCase().trim() === search) {
        setSelectedContainer(uniqueContainer);
        setSearchTerm("");
      } else if (selectedContainer?.id !== uniqueContainer.id) {
        setSelectedContainer(uniqueContainer);
        setSearchTerm("");
      }
    } else if (search && filteredContainers.length !== 1) {
      setSelectedContainer(null);
    } else if (!search && selectedContainer) {
      if (!containers.find(c => c.id === selectedContainer.id)) {
          setSelectedContainer(null);
      }
    }
  }, [searchTerm, filteredContainers, selectedContainer, containers]);

  const stats = useMemo(() => {
    const total = containers.length; // Usamos o total de containers (não filtrados) para os KPIs
    const devolvidos = containers.filter(isContainerDevolvido).length;
    const vencidos = containers.filter(c => getDiasRestantes(c) === 0 && !isContainerDevolvido(c)).length;
    const pendentes = containers.filter(c => !isContainerDevolvido(c) && getDiasRestantes(c) > 0).length;
    const armadoresFiltrados = [...new Set(filteredContainers.map(c => c.armador).filter(Boolean))].length;

    return { total, devolvidos, pendentes, vencidos, armadoresFiltrados };
  }, [containers, filteredContainers]);

  const handleEdit = async (id: string, data: Partial<Container>) => {
    try {
        await onContainerEdit(id, data);
        toast({
            title: "Container atualizado!",
            description: "Os dados do container foram salvos com sucesso.",
        });
    } catch (e) {
        // Error is handled in the hook
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
        await onContainerDelete(id);
        if (selectedContainer?.id === id) {
            setSelectedContainer(null);
        }
    } catch (e) {
        // Error is handled in the hook
    }
  };

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="secondary" className="text-xs">-</Badge>;
    const statusLower = String(status).toLowerCase();
    if (statusLower.includes("ok") || statusLower.includes("devolvido")) {
      return <Badge className="bg-success text-white text-xs">{status}</Badge>;
    }
    if (statusLower.includes("aguardando") || statusLower.includes("verificar")) {
      return <Badge className="bg-warning text-white text-xs">{status}</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  };

  const getDiasRestantesColor = (dias: number | string) => {
    if (typeof dias === "string") return "text-muted-foreground";
    if (dias === 0) return "text-danger font-semibold";
    if (dias <= 3) return "text-warning font-semibold";
    return "text-success";
  };

  const getCardBorderColor = (dias: number | string) => {
    if (typeof dias === "string") return "border-transparent";
    if (dias === 0) return "border-danger";
    if (dias <= 3) return "border-warning";
    return "border-transparent";
  };

  const ContainerCard = ({ container }: { container: Container }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "hover:shadow-lg transition-shadow cursor-pointer border-l-4",
          getCardBorderColor(container.prazoDias)
        )} 
        onClick={() => setSelectedContainer(container)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm font-bold text-primary">{container.container}</CardTitle>
              <p className="text-xs text-muted-foreground">{container.armador}</p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              {getStatusBadge(container.status)}
              <span className={cn("text-xs font-semibold", getDiasRestantesColor(container.prazoDias))}>
                {container.prazoDias} dias
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div>
              <span className="text-muted-foreground">Data Entrada:</span>
              <p className="font-medium">{formatDateToBR(container.dataEntrada) || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Placa:</span>
              <p className="font-medium">{container.placa || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Motorista:</span>
              <p className="font-medium truncate">{container.motoristaEntrada || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Cliente:</span>
              <p className="font-medium truncate">{container.clienteEntrada || "-"}</p>
            </div>
          </div>
          
          <div className="flex gap-1 pt-1">
            <Button variant="outline" size="sm" className="flex-1 h-6 text-xs gap-1" onClick={(e) => {
                e.stopPropagation();
                setSelectedContainer(container);
            }}>
              <Eye className="h-3 w-3" />
              Detalhes
            </Button>
            <ContainerFormDialog
              container={container}
              onSave={(data) => handleEdit(container.id, data)}
              trigger={
                <Button variant="outline" size="sm" className="h-6 px-1" onClick={(e) => e.stopPropagation()}>
                  <Filter className="h-3 w-3" />
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full px-4">
      <ContainerHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        armadorFilter={armadorFilter}
        setArmadorFilter={setArmadorFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        allArmadores={allArmadores}
        containers={containers}
        filteredContainersCount={filteredContainers.length}
        totalContainersCount={containers.length}
        stats={stats}
        onContainerAdd={onContainerAdd}
        title="Gestão de Containers-Vazios"
        subtitle="Controle de entrada e saída de containers vazios"
      />

      <div className="flex-1 pt-2">
        <AnimatePresence mode="wait">
          {viewMode === "table" ? (
            <motion.div
              key="table"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ContainerTable 
                containers={filteredContainers} 
                onContainerUpdate={onContainerUpdate}
                onContainerEdit={handleEdit}
                onContainerDelete={handleDelete}
                onContainerSelect={setSelectedContainer}
              />
            </motion.div>
          ) : (
            <motion.div
              key="cards"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredContainers.length === 0 ? (
                <div className="col-span-full text-center py-6 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum container encontrado</p>
                </div>
              ) : (
                filteredContainers.map((container) => (
                  <ContainerCard key={container.id} container={container} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ContainerDetailsSidebar
        container={selectedContainer}
        onClose={() => setSelectedContainer(null)}
        onContainerUpdate={async (id, files) => {
            await onContainerUpdate(id, files);
            if (selectedContainer && selectedContainer.id === id) {
                setSelectedContainer(prev => prev ? { ...prev, files } : null);
            }
        }}
      />
    </div>
  );
}