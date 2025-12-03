import { Container } from "@/types/container";
import { InventoryItem } from "@/types/inventory";
import { InventoryTable } from "@/components/InventoryTable";
import { AnaliseInventario } from "@/components/AnaliseInventario";
import { generateInventoryFromContainers } from "@/lib/inventoryGenerator";
import { useMemo, useState } from "react";
import { InventoryFilters } from "@/components/InventoryFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Search, Filter, Grid, List, Eye, Calendar, Truck, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface InventarioProps {
  containers: Container[];
}

export default function Inventario({ containers }: InventarioProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [itemTypeFilter, setItemTypeFilter] = useState<InventoryItem['itemType'] | 'all'>("all");
  const [statusFilter, setStatusFilter] = useState<InventoryItem['status'] | 'all'>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const isMobile = useIsMobile();
  
  // 1. Gera o inventário dinamicamente a partir dos containers
  const inventory: InventoryItem[] = useMemo(() => {
    return generateInventoryFromContainers(containers);
  }, [containers]);

  // 2. Aplica a filtragem
  const filteredInventory = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    
    return inventory.filter(item => {
      // Filtro de Pesquisa de Texto Livre
      const matchesSearch = 
        item.container.toLowerCase().includes(searchLower) ||
        item.armador.toLowerCase().includes(searchLower) ||
        item.details.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Filtro por Tipo de Item
      if (itemTypeFilter !== 'all' && item.itemType !== itemTypeFilter) return false;

      // Filtro por Status
      if (statusFilter !== 'all') {
        const itemStatusLower = String(item.status || '').toLowerCase();
        const filterStatusLower = String(statusFilter).toLowerCase();
        
        // Usamos includes para capturar variações como 'Devolvido (RIC OK)'
        if (!itemStatusLower.includes(filterStatusLower)) return false;
      }

      return true;
    });
  }, [inventory, searchTerm, itemTypeFilter, statusFilter]);

  // Estatísticas do inventário (Contando containers únicos)
  const inventoryStats = useMemo(() => {
    const totalItems = filteredInventory.length;
    
    const uniqueContainersByStatus = (statusKeyword: string) => {
        const containerIds = new Set<string>();
        filteredInventory.forEach(item => {
            if (String(item.status || '').toLowerCase().includes(statusKeyword)) {
                containerIds.add(item.containerId);
            }
        });
        return containerIds.size;
    };

    // Contagem de containers únicos
    const emEstoque = uniqueContainersByStatus("em estoque");
    const aguardandoDevolucao = uniqueContainersByStatus("aguardando devolução");
    const devolvidos = uniqueContainersByStatus("ric ok"); // Usamos 'ric ok' para capturar o status final

    // Contagem de itens (não únicos)
    const totalTrocas = filteredInventory.filter(item => item.itemType === 'Troca').length;
    const totalBaixas = filteredInventory.filter(item => item.itemType === 'Baixa Pátio').length;
    const totalDevolucoes = filteredInventory.filter(item => item.itemType === 'Devolução').length;
    
    return {
      totalItems, // Total de linhas de rastreio
      emEstoque, // Total de containers únicos em estoque físico
      aguardandoDevolucao, // Total de containers únicos aguardando devolução
      devolvidos, // Total de containers únicos devolvidos
      totalTrocas,
      totalBaixas,
      totalDevolucoes,
    };
  }, [filteredInventory]);

  const getStatusBadge = (status: string | undefined) => {
    const statusLower = String(status || '').toLowerCase();
    
    if (statusLower.includes("ric ok") || statusLower.includes("devolvido")) {
      return <Badge className="bg-success text-white hover:bg-success/80 text-xs">Devolvido (RIC OK)</Badge>;
    }
    if (statusLower.includes("aguardando devolução")) {
      return <Badge className="bg-warning text-white hover:bg-warning/80 text-xs">Aguardando Devolução</Badge>;
    }
    if (statusLower.includes("em estoque")) {
      return <Badge className="bg-primary text-white hover:bg-primary/90 text-xs">Em Estoque</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{status || 'Outro'}</Badge>;
  };

  const getItemTypeIcon = (itemType: InventoryItem['itemType']) => {
    switch (itemType) {
      case 'Troca':
        return <Truck className="h-3 w-3 text-primary" />;
      case 'Baixa Pátio':
        return <AlertTriangle className="h-3 w-3 text-warning" />;
      case 'Devolução':
        return <CheckCircle2 className="h-3 w-3 text-success" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  const getItemTypeBadge = (itemType: InventoryItem['itemType']) => {
    const variants = {
      'Troca': 'bg-primary/10 text-primary border-primary/20',
      'Baixa Pátio': 'bg-warning/10 text-warning border-warning/20',
      'Devolução': 'bg-success/10 text-success border-success/20',
    };
    
    return (
      <Badge variant="outline" className={cn(variants[itemType], "gap-1 h-5 px-1.5 text-xs")}>
        {getItemTypeIcon(itemType)}
        {itemType}
      </Badge>
    );
  };

  const InventoryCard = ({ item }: { item: InventoryItem }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02]">
        <CardHeader className="pb-1 p-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-sm font-bold text-primary flex items-center gap-1">
                <Package className="h-4 w-4" />
                {item.container}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{item.armador}</p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              {getItemTypeBadge(item.itemType)}
              {getStatusBadge(item.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 p-3 pt-1">
          <div className="space-y-1">
            <div className="flex items-start gap-1 text-xs">
              <span className="text-muted-foreground shrink-0">Detalhes:</span>
              <p className="font-medium text-xs line-clamp-2">{item.details}</p>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Atualizado:</span>
              <span className="text-xs">{new Date(item.lastUpdated).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          
          <div className="flex gap-1 pt-2">
            <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1" onClick={() => setSelectedItem(item)}>
              <Eye className="h-3 w-3" />
              Detalhes
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const StatCard = ({ title, value, subtitle, icon: Icon, color, delay }: any) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className={`border-l-4 border-l-${color} hover:shadow-md transition-all duration-300 hover:scale-[1.02]`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 p-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={`h-3 w-3 text-${color}`} />
        </CardHeader>
        <CardContent className="p-1 pt-0">
          <div className="text-sm font-bold text-foreground">{value}</div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho Fixo (Título, Filtros, KPIs) */}
      <div className="sticky top-0 z-40 bg-background pb-2 border-b border-border/50 shadow-sm">
        <div className="space-y-2">
          {/* Título */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventário Derivado de Containers</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Rastreamento automático de itens de troca, baixa e devolução associados aos containers.
            </p>
          </div>
          
          {/* Ações e Filtros (Consolidado) */}
          <div className="flex flex-col gap-1">
            {/* Linha 1: Pesquisa e Visualização */}
            <div className="flex flex-col sm:flex-row gap-1">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por container, armador ou detalhes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 text-xs h-7"
                />
              </div>
              
              <div className="flex gap-1 shrink-0">
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

            {/* Linha 2: Filtros Avançados */}
            <InventoryFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              itemTypeFilter={itemTypeFilter}
              setItemTypeFilter={setItemTypeFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>

          {/* KPIs do Inventário */}
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total de Itens"
              value={inventoryStats.totalItems}
              subtitle={`${inventoryStats.totalTrocas} trocas, ${inventoryStats.totalBaixas} baixas`}
              icon={Package}
              color="primary"
              delay={0.1}
            />
            <StatCard
              title="Containers Em Estoque"
              value={inventoryStats.emEstoque}
              subtitle={`Containers únicos no pátio`}
              icon={Clock}
              color="primary"
              delay={0.2}
            />
            <StatCard
              title="Containers Aguardando Devolução"
              value={inventoryStats.aguardandoDevolucao}
              subtitle={`Containers únicos que saíram, mas não foram concluídos`}
              icon={AlertTriangle}
              color="warning"
              delay={0.3}
            />
            <StatCard
              title="Containers Devolvidos (RIC OK)"
              value={inventoryStats.devolvidos}
              subtitle={`Containers únicos com ciclo concluído`}
              icon={CheckCircle2}
              color="success"
              delay={0.4}
            />
          </div>

          {/* Resultados da busca */}
          <div className="flex justify-between items-center pt-1">
            <p className="text-xs text-muted-foreground">
              {filteredInventory.length} de {inventory.length} itens encontrados
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo principal - Tabela ou Cards */}
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
              <InventoryTable 
                inventory={filteredInventory} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="cards"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
            >
              {filteredInventory.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum item de inventário encontrado</p>
                </div>
              ) : (
                filteredInventory.map((item) => (
                  <InventoryCard key={item.id + item.itemType} item={item} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de detalhes do item (mobile) */}
      {selectedItem && isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setSelectedItem(null)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="bg-background w-full max-h-[80vh] overflow-y-auto rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  {selectedItem.container}
                </h3>
                <p className="text-muted-foreground">{selectedItem.armador}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Tipo de Item</span>
                  <div className="mt-1">{getItemTypeBadge(selectedItem.itemType)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm text-muted-foreground">Detalhes:</span>
                  <p className="text-sm flex-1">{selectedItem.details}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Última Atualização:</span>
                  <span className="text-sm">{new Date(selectedItem.lastUpdated).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}