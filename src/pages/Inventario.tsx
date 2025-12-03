import { Container } from "@/types/container";
import { InventoryItem } from "@/types/inventory";
import { InventoryTable } from "@/components/InventoryTable";
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
import { isContainerDevolvido } from "@/lib/containerUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InventarioProps {
  containers: Container[];
}

// Definindo um tipo de item de inventário simplificado para esta visualização
interface SimplifiedInventoryItem {
    id: string;
    container: string;
    armador: string;
    itemType: 'Prazo' | 'Devolução' | 'Estoque';
    status: 'Vencido' | 'Próximo' | 'Em Estoque' | 'Devolvido';
    details: string;
    lastUpdated: string;
}

export default function Inventario({ containers }: InventarioProps) {
  const [searchTerm, setSearchTerm] = useState("");
  // Usaremos statusFilter para filtrar por status de prazo/devolução
  const [statusFilter, setStatusFilter] = useState<'all' | 'devolvidos' | 'vencidos' | 'proximos' | 'em estoque'>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedItem, setSelectedItem] = useState<SimplifiedInventoryItem | null>(null);
  const isMobile = useIsMobile();
  
  const getDiasRestantes = (c: Container) => typeof c.prazoDias === 'number' ? c.prazoDias : 0;

  // 1. Geração de Inventário Simplificado (Mapeamento para a visualização)
  const simplifiedInventory: SimplifiedInventoryItem[] = useMemo(() => {
    return containers.map(c => {
        const isDevolvido = isContainerDevolvido(c);
        const dias = getDiasRestantes(c);
        
        let status: SimplifiedInventoryItem['status'];
        let details: string;
        let itemType: SimplifiedInventoryItem['itemType'];

        if (isDevolvido) {
            status = 'Devolvido';
            details = `Container devolvido (RIC OK ou Saída SJP preenchida).`;
            itemType = 'Devolução';
        } else if (dias === 0) {
            status = 'Vencido';
            details = `Free Time expirado. Demurrage: ${c.demurrage || 'N/A'}.`;
            itemType = 'Prazo';
        } else if (dias > 0 && dias <= 3) {
            status = 'Próximo';
            details = `Faltam ${dias} dias para o Free Time expirar.`;
            itemType = 'Prazo';
        } else {
            status = 'Em Estoque';
            details = `Em pátio. Prazo restante: ${dias} dias.`;
            itemType = 'Estoque';
        }

        return {
            id: c.id,
            container: c.container,
            armador: c.armador,
            itemType,
            status,
            details,
            lastUpdated: c.dataEntrada || new Date().toISOString(), // Usando data de entrada como referência
        };
    });
  }, [containers]);

  // 2. Aplica a filtragem
  const filteredInventory = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    
    return simplifiedInventory.filter(item => {
      // Filtro de Pesquisa de Texto Livre
      const matchesSearch = 
        item.container.toLowerCase().includes(searchLower) ||
        item.armador.toLowerCase().includes(searchLower) ||
        item.details.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Filtro por Status de Prazo/Devolução
      if (statusFilter === 'devolvidos') {
        return item.status === 'Devolvido';
      }
      if (statusFilter === 'vencidos') {
        return item.status === 'Vencido';
      }
      if (statusFilter === 'proximos') {
        return item.status === 'Próximo';
      }
      if (statusFilter === 'em estoque') {
        return item.status === 'Em Estoque';
      }
      
      return true;
    });
  }, [simplifiedInventory, searchTerm, statusFilter]);

  // Estatísticas do inventário (Contando containers únicos)
  const inventoryStats = useMemo(() => {
    const totalItems = containers.length; // Total de containers (não filtrados)
    
    const devolvidos = containers.filter(isContainerDevolvido).length;
    const vencidos = containers.filter(c => getDiasRestantes(c) === 0 && !isContainerDevolvido(c)).length;
    const proximos = containers.filter(c => getDiasRestantes(c) > 0 && getDiasRestantes(c) <= 3 && !isContainerDevolvido(c)).length;
    
    // Em Estoque (Físico) = Containers que não foram devolvidos E têm prazo > 3 dias
    const emEstoque = containers.filter(c => !isContainerDevolvido(c) && getDiasRestantes(c) > 3).length;
    
    return {
      totalItems,
      emEstoque,
      vencidos,
      proximos,
      devolvidos,
    };
  }, [containers]);

  const getStatusBadge = (status: SimplifiedInventoryItem['status'] | string) => {
    const statusLower = String(status).toLowerCase();
    
    if (statusLower.includes("devolvido")) {
      return <Badge className="bg-success text-white hover:bg-success/80 text-xs">Devolvido</Badge>;
    }
    if (statusLower.includes("vencido")) {
      return <Badge className="bg-danger text-white hover:bg-danger/80 text-xs">Vencido (0 dias)</Badge>;
    }
    if (statusLower.includes("próximo")) {
      return <Badge className="bg-warning text-white hover:bg-warning/80 text-xs">Próximo (1-3 dias)</Badge>;
    }
    if (statusLower.includes("em estoque")) {
      return <Badge className="bg-primary text-white hover:bg-primary/90 text-xs">Em Estoque</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{status || 'Outro'}</Badge>;
  };

  const getItemTypeIcon = (itemType: SimplifiedInventoryItem['itemType']) => {
    switch (itemType) {
      case 'Prazo':
        return <Clock className="h-3 w-3 text-warning" />;
      case 'Devolução':
        return <CheckCircle2 className="h-3 w-3 text-success" />;
      case 'Estoque':
        return <Package className="h-3 w-3 text-primary" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  const getItemTypeBadge = (itemType: SimplifiedInventoryItem['itemType']) => {
    const variants = {
      'Prazo': 'bg-warning/10 text-warning border-warning/20',
      'Devolução': 'bg-success/10 text-success border-success/20',
      'Estoque': 'bg-primary/10 text-primary border-primary/20',
    };
    
    return (
      <Badge variant="outline" className={cn(variants[itemType], "gap-1 h-5 px-1.5 text-xs")}>
        {getItemTypeIcon(itemType)}
        {itemType}
      </Badge>
    );
  };

  const InventoryCard = ({ item }: { item: SimplifiedInventoryItem }) => (
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
    <div className="flex flex-col h-full px-4">
      {/* Cabeçalho Fixo (Título, Filtros, KPIs) */}
      <div className="sticky top-0 z-40 bg-background pb-2 border-b border-border/50 shadow-sm -mx-4 px-4">
        <div className="space-y-2">
          {/* Título */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventário de Containers Vazios (Prazo/Devolução)</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Visão consolidada do status de prazo e devolução dos containers vazios.
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

            {/* Linha 2: Filtros Avançados (Simplificados) */}
            <div className="flex flex-col sm:flex-row gap-1 flex-wrap">
                <Select
                    value={statusFilter}
                    onValueChange={(value: any) => setStatusFilter(value)}
                >
                    <SelectTrigger className="w-full sm:w-[140px] h-7 text-xs">
                        <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
                        <SelectValue placeholder="Filtrar por Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="em estoque">Em Estoque (Físico)</SelectItem>
                        <SelectItem value="proximos">Próximos (1-3 dias)</SelectItem>
                        <SelectItem value="vencidos">Vencidos (0 dias)</SelectItem>
                        <SelectItem value="devolvidos">Devolvidos</SelectItem>
                    </SelectContent>
                </Select>
                {/* Removendo filtro de ItemType, pois a lógica agora é baseada em Prazo/Devolução */}
            </div>
          </div>

          {/* KPIs do Inventário (Baseado em Containers.tsx) */}
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Em Estoque (Físico)"
              value={inventoryStats.emEstoque}
              subtitle={`Containers com prazo > 3 dias`}
              icon={Package}
              color="primary"
              delay={0.1}
            />
            <StatCard
              title="Próximos do Vencimento"
              value={inventoryStats.proximos}
              subtitle={`1 a 3 dias restantes`}
              icon={Clock}
              color="warning"
              delay={0.2}
            />
            <StatCard
              title="Vencidos (Demurrage)"
              value={inventoryStats.vencidos}
              subtitle={`0 dias restantes`}
              icon={AlertTriangle}
              color="danger"
              delay={0.3}
            />
            <StatCard
              title="Devolvidos (Saídos)"
              value={inventoryStats.devolvidos}
              subtitle={`Com Saída SJP ou RIC OK`}
              icon={CheckCircle2}
              color="success"
              delay={0.4}
            />
          </div>

          {/* Resultados da busca */}
          <div className="flex justify-between items-center pt-1">
            <p className="text-xs text-muted-foreground">
              {filteredInventory.length} de {containers.length} containers encontrados
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
              {/* Reutilizando InventoryTable, mas passando o inventário simplificado */}
              <InventoryTable 
                inventory={filteredInventory as any} // Cast para InventoryItem[] para compatibilidade de tipos
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
                  <p>Nenhum container encontrado</p>
                </div>
              ) : (
                filteredInventory.map((item) => (
                  <InventoryCard key={item.id} item={item} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de detalhes do item (mobile) - Simplificado */}
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
                  <span className="text-sm text-muted-foreground">Tipo de Rastreio</span>
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
                  <span className="text-sm text-muted-foreground">Atualizado:</span>
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