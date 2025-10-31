import { useState, useMemo } from "react";
import { Container, ContainerFile } from "@/types/container";
import { ContainerTable } from "@/components/ContainerTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, AlertCircle, CheckCircle, Search, Filter, Grid, List, Download, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContainerFormDialog } from "@/components/ContainerFormDialog";
import { FileUploadDialog } from "@/components/FileUploadDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { VencimentoAlert } from "@/components/VencimentoAlert"; // Importando o novo componente

interface ContainersPageProps {
  containers: Container[];
  onContainerUpdate: (containerId: string, files: ContainerFile[]) => void;
  onContainerAdd: (container: Partial<Container>) => void;
  onContainerEdit: (id: string, container: Partial<Container>) => void;
  onContainerDelete: (id: string) => void;
}

export default function Containers({ 
  containers, 
  onContainerUpdate, 
  onContainerAdd, 
  onContainerEdit, 
  onContainerDelete 
}: ContainersPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  // Status filter agora pode ser 'vencidos' ou 'proximos'
  const [statusFilter, setStatusFilter] = useState<string>("all"); 
  const [armadorFilter, setArmadorFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const isMobile = useIsMobile();

  // Obter armadores únicos para o filtro
  const armadores = useMemo(() => {
    const uniqueArmadores = [...new Set(containers.map(c => c.armador).filter(Boolean))];
    return uniqueArmadores.sort();
  }, [containers]);

  // Função para calcular dias restantes como número
  const getDiasRestantes = (c: Container) => typeof c.diasRestantes === 'number' ? c.diasRestantes : 0;

  // Filtrar containers
  const filteredContainers = useMemo(() => {
    return containers.filter(c => {
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = !search || 
        c.container.toLowerCase().includes(search) ||
        c.armador.toLowerCase().includes(search) ||
        c.motorista?.toLowerCase().includes(search) ||
        c.placas?.toLowerCase().includes(search);

      let matchesStatus = true;
      const dias = getDiasRestantes(c);
      const statusLower = String(c.status || '').toLowerCase();

      if (statusFilter === "devolvidos") {
        matchesStatus = statusLower.includes("ok") || statusLower.includes("devolvido");
      } else if (statusFilter === "pendentes") {
        matchesStatus = statusLower.includes("aguardando") || statusLower.includes("verificar");
      } else if (statusFilter === "vencidos") {
        matchesStatus = dias === 0;
      } else if (statusFilter === "proximos") {
        matchesStatus = dias > 0 && dias <= 3;
      } else if (statusFilter === "all") {
        matchesStatus = true;
      }

      const matchesArmador = armadorFilter === "all" || c.armador === armadorFilter;

      return matchesSearch && matchesStatus && matchesArmador;
    });
  }, [containers, searchTerm, statusFilter, armadorFilter]);

  const stats = useMemo(() => ({
    total: containers.length,
    devolvidos: containers.filter(c => {
      const status = String(c.status || '').toLowerCase();
      return status.includes("ok") || status.includes("devolvido");
    }).length,
    pendentes: containers.filter(c => {
      const status = String(c.status || '').toLowerCase();
      return status.includes("aguardando") || status.includes("verificar");
    }).length,
    vencidos: containers.filter(c => getDiasRestantes(c) === 0).length,
  }), [containers]);

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

  const ContainerCard = ({ container }: { container: Container }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedContainer(container)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm font-bold text-primary">{container.container}</CardTitle>
              <p className="text-xs text-muted-foreground">{container.armador}</p>
            </div>
            <div className="flex flex-col gap-1">
              {getStatusBadge(container.status)}
              <span className={cn("text-xs font-semibold", getDiasRestantesColor(container.diasRestantes))}>
                {container.diasRestantes} dias
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div>
              <span className="text-muted-foreground">Data Op:</span>
              <p className="font-medium">{container.dataOperacao || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Placas:</span>
              <p className="font-medium">{container.placas || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Motorista:</span>
              <p className="font-medium truncate">{container.motorista || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Depot:</span>
              <p className="font-medium truncate">{container.depotDevolucao || "-"}</p>
            </div>
          </div>
          
          <div className="flex gap-1 pt-1">
            <FileUploadDialog
              containerId={container.id}
              files={container.files || []}
              onFilesChange={(files) => onContainerUpdate(container.id, files)}
              trigger={
                <Button variant="outline" size="sm" className="flex-1 h-6 text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Arquivos ({container.files?.length || 0})
                </Button>
              }
            />
            <ContainerFormDialog
              container={container}
              onSave={(data) => onContainerEdit(container.id, data)}
              trigger={
                <Button variant="outline" size="sm" className="h-6 px-1">
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
    <div className="flex flex-col h-full">
      {/* Cabeçalho Fixo (Título, Filtros, KPIs) */}
      <div className="sticky top-0 z-40 bg-background pb-2 border-b border-border/50 shadow-sm">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gestão de Containers</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Controle de entrada e saída de containers CAS
              </p>
            </div>
            
            {/* Barra de ações e filtros */}
            <div className="flex flex-col sm:flex-row gap-1">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar container, armador, motorista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 text-xs h-7"
                />
              </div>
              
              <Select 
                value={statusFilter} 
                onValueChange={(value) => {
                    // Se o valor for um dos filtros de alerta, definimos o filtro de status
                    if (value === 'vencidos' || value === 'proximos') {
                        setStatusFilter(value);
                    } else {
                        // Caso contrário, usamos o valor padrão do Select
                        setStatusFilter(value);
                    }
                }}
              >
                <SelectTrigger className="w-full sm:w-[140px] h-7 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="devolvidos">Devolvidos</SelectItem>
                  <SelectItem value="pendentes">Pendentes</SelectItem>
                  <SelectItem value="vencidos">Vencidos (0 dias)</SelectItem>
                  <SelectItem value="proximos">Próximos (1-3 dias)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={armadorFilter} onValueChange={setArmadorFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-7 text-xs">
                  <SelectValue placeholder="Armador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Armadores</SelectItem>
                  {armadores.map(armador => (
                    <SelectItem key={armador} value={armador}>{armador}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-1">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-7 px-2"
                >
                  <List className="h-3 w-3" />
                </Button>
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="h-7 px-2"
                >
                  <Grid className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Alerta de Vencimento (Novo) */}
          <VencimentoAlert 
            containers={containers} 
            onFilterChange={setStatusFilter} 
            currentFilter={statusFilter}
          />

          {/* KPIs - Versão responsiva */}
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-0.5 p-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Total
                  </CardTitle>
                  <Package className="h-3 w-3 text-primary" />
                </CardHeader>
                <CardContent className="p-1 pt-0">
                  <div className="text-sm font-bold text-foreground">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {armadores.length} armadores
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="border-l-4 border-l-success hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-0.5 p-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Devolvidos
                  </CardTitle>
                  <CheckCircle className="h-3 w-3 text-success" />
                </CardHeader>
                <CardContent className="p-1 pt-0">
                  <div className="text-sm font-bold text-foreground">{stats.devolvidos}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stats.total > 0 ? ((stats.devolvidos / stats.total) * 100).toFixed(1) : 0}%
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="border-l-4 border-l-warning hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-0.5 p-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Pendentes
                  </CardTitle>
                  <TrendingUp className="h-3 w-3 text-warning" />
                </CardHeader>
                <CardContent className="p-1 pt-0">
                  <div className="text-sm font-bold text-foreground">{stats.pendentes}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stats.total > 0 ? ((stats.pendentes / stats.total) * 100).toFixed(1) : 0}%
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card className="border-l-4 border-l-danger hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-0.5 p-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Vencidos
                  </CardTitle>
                  <AlertCircle className="h-3 w-3 text-danger" />
                </CardHeader>
                <CardContent className="p-1 pt-0">
                  <div className="text-sm font-bold text-foreground">{stats.vencidos}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stats.total > 0 ? ((stats.vencidos / stats.total) * 100).toFixed(1) : 0}%
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Resultados da busca */}
          <div className="flex justify-between items-center pt-1">
            <p className="text-xs text-muted-foreground">
              {filteredContainers.length} de {containers.length} containers
            </p>
            <ContainerFormDialog
              onSave={onContainerAdd}
              trigger={
                <Button size="sm" className="gap-1 h-7 px-2 text-xs">
                  <Package className="h-3 w-3" />
                  Novo Container
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Conteúdo principal - Tabela ou Cards (Roleable) */}
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
                onContainerEdit={onContainerEdit}
                onContainerDelete={onContainerDelete}
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

      {/* Modal de detalhes do container (mobile) - Mantido fora do fluxo de rolagem */}
      {selectedContainer && isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setSelectedContainer(null)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="bg-background w-full max-h-[80vh] overflow-y-auto rounded-t-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold">{selectedContainer.container}</h3>
                <p className="text-muted-foreground">{selectedContainer.armador}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedContainer(null)}>
                ×
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedContainer.status)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Dias Restantes</span>
                  <p className={cn("font-semibold", getDiasRestantesColor(selectedContainer.diasRestantes))}>
                    {selectedContainer.diasRestantes}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Data Operação:</span>
                  <span>{selectedContainer.dataOperacao || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Placas:</span>
                  <span>{selectedContainer.placas || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Motorista:</span>
                  <span>{selectedContainer.motorista || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Depot:</span>
                  <span>{selectedContainer.depotDevolucao || "-"}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <FileUploadDialog
                  containerId={selectedContainer.id}
                  files={selectedContainer.files || []}
                  onFilesChange={(files) => {
                    onContainerUpdate(selectedContainer.id, files);
                    setSelectedContainer({ ...selectedContainer, files });
                  }}
                  trigger={
                    <Button variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Arquivos
                    </Button>
                  }
                />
                <ContainerFormDialog
                  container={selectedContainer}
                  onSave={(data) => {
                    onContainerEdit(selectedContainer.id, data);
                    setSelectedContainer({ ...selectedContainer, ...data });
                  }}
                  trigger={
                    <Button variant="outline">
                      <Filter className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}