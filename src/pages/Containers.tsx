import { useState, useMemo, useEffect } from "react";
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
import { VencimentoAlert } from "@/components/VencimentoAlert";
import { ContainerDetailsSidebar } from "@/components/ContainerDetailsSidebar";
import { formatDateToBR } from "@/lib/excelUtils"; // Importando a função de formatação

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

  // Obter armadores únicos para o filtro (baseado em todos os containers)
  const allArmadores = useMemo(() => {
    const uniqueArmadores = [...new Set(containers.map(c => c.armador).filter(Boolean))];
    return uniqueArmadores.sort();
  }, [containers]);

  // Função para calcular dias restantes como número (agora mapeado de prazoDias)
  const getDiasRestantes = (c: Container) => typeof c.prazoDias === 'number' ? c.prazoDias : 0;

  // Filtrar containers
  const filteredContainers = useMemo(() => {
    return containers.filter(c => {
      const search = searchTerm.toLowerCase().trim();
      
      // Atualizando a pesquisa para incluir os novos campos
      const matchesSearch = !search || 
        c.container.toLowerCase().includes(search) ||
        c.armador.toLowerCase().includes(search) ||
        c.motoristaEntrada?.toLowerCase().includes(search) || // Novo campo
        c.placa?.toLowerCase().includes(search) || // Novo campo
        c.clienteEntrada?.toLowerCase().includes(search) || // Novo campo
        c.clienteSaidaDestino?.toLowerCase().includes(search) || // Novo campo
        c.bookingAtrelado?.toLowerCase().includes(search); // Novo campo

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

  // NOVO EFEITO: Abrir sidebar se a pesquisa for exata e única
  useEffect(() => {
    const search = searchTerm.toLowerCase().trim();
    
    // Se houver um termo de pesquisa e o resultado for exatamente um container
    if (search && filteredContainers.length === 1) {
      const uniqueContainer = filteredContainers[0];
      
      // Verificação adicional: se o termo de pesquisa for o container exato
      if (uniqueContainer.container.toLowerCase().trim() === search) {
        setSelectedContainer(uniqueContainer);
        setSearchTerm(""); // Limpa o campo de pesquisa após abrir a sidebar
      } else if (selectedContainer?.id !== uniqueContainer.id) {
        // Se for um filtro que resultou em 1, mas não é a pesquisa exata do container, 
        // ainda podemos abrir, mas a verificação exata é mais segura para evitar aberturas acidentais.
        // Vamos manter a abertura se for o único resultado.
        setSelectedContainer(uniqueContainer);
        setSearchTerm(""); // Limpa o campo de pesquisa após abrir a sidebar
      }
    } else if (search && filteredContainers.length !== 1) {
      // Se o usuário está digitando e o resultado não é único, ou se limpou a pesquisa, feche a sidebar
      setSelectedContainer(null);
    } else if (!search && selectedContainer) {
      // Se a pesquisa foi limpa, mas a sidebar está aberta, mantenha-a aberta (o usuário pode ter clicado nela)
      // Apenas feche se o container selecionado não estiver mais na lista filtrada (o que não deve acontecer se a pesquisa for limpa)
    }
  }, [searchTerm, filteredContainers, selectedContainer]);


  // NOVO CÁLCULO DE STATS: Baseado em filteredContainers
  const stats = useMemo(() => {
    const total = filteredContainers.length;
    
    const devolvidos = filteredContainers.filter(c => {
      const status = String(c.status || '').toLowerCase();
      return status.includes("ok") || status.includes("devolvido");
    }).length;
    
    const pendentes = filteredContainers.filter(c => {
      const status = String(c.status || '').toLowerCase();
      return status.includes("aguardando") || status.includes("verificar");
    }).length;
    
    const vencidos = filteredContainers.filter(c => getDiasRestantes(c) === 0).length;
    
    const armadoresFiltrados = [...new Set(filteredContainers.map(c => c.armador).filter(Boolean))].length;

    return {
      total,
      devolvidos,
      pendentes,
      vencidos,
      armadoresFiltrados,
    };
  }, [filteredContainers]);

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
              <p className="font-medium">{container.dataEntrada || "-"}</p>
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
                e.stopPropagation(); // Evita abrir a sidebar
                setSelectedContainer(container); // Abre a sidebar de detalhes
            }}>
              <Eye className="h-3 w-3" />
              Detalhes
            </Button>
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
                Controle de entrada e saída de containers
              </p>
            </div>
            
            {/* Barra de ações e filtros */}
            <div className="flex flex-col sm:flex-row gap-1">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar container, armador, motorista, cliente..."
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
                  {allArmadores.map(armador => (
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
                    {stats.armadoresFiltrados} armadores
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
                onContainerSelect={setSelectedContainer} // Adicionando o handler de seleção
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

      {/* Sidebar de Detalhes (Substitui o modal mobile) */}
      <ContainerDetailsSidebar
        container={selectedContainer}
        onClose={() => setSelectedContainer(null)}
        onContainerUpdate={(id, files) => {
            onContainerUpdate(id, files);
            // Atualiza o estado local para refletir os novos arquivos na sidebar
            if (selectedContainer && selectedContainer.id === id) {
                setSelectedContainer(prev => prev ? { ...prev, files } : null);
            }
        }}
      />
    </div>
  );
}