import { Container } from "@/types/container";
import { InventoryItem } from "@/types/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, CheckCircle2, Clock, Warehouse } from "lucide-react";
import { useMemo } from "react";

interface AnaliseInventarioProps {
  containers: Container[]; // Containers totais (para KPIs globais)
  inventory: InventoryItem[]; // Inventário filtrado (para KPIs contextuais)
}

export function AnaliseInventario({ containers, inventory: filteredInventory }: AnaliseInventarioProps) {
  
  // --- Análise de Containers (GLOBAL - Não Filtrada) ---
  const containerStats = useMemo(() => {
    const devolvidos = containers.filter(c => {
      const status = String(c.status || '').toLowerCase();
      return status.includes("ok") || status.includes("devolvido");
    }).length;
    const pendentes = containers.filter(c => {
      const status = String(c.status || '').toLowerCase();
      return status.includes("aguardando") || status.includes("verificar");
    }).length;
    const vencidos = containers.filter(c => {
      const dias = typeof c.prazoDias === 'number' ? c.prazoDias : 0; // Usando prazoDias
      return dias === 0;
    }).length;

    return {
      total: containers.length,
      devolvidos,
      pendentes,
      vencidos,
    };
  }, [containers]);

  // --- Análise de Inventário Derivado (CONTEXTUAL - Filtrada) ---
  const inventoryStats = useMemo(() => {
    const totalItems = filteredInventory.length;
    
    // Função auxiliar para normalizar o status
    const normalizeStatus = (status: string | undefined) => String(status || '').toLowerCase();

    // Contagem de itens Aguardando Devolução
    const aguardandoDevolucao = filteredInventory.filter(item => {
      const status = normalizeStatus(item.status);
      return status.includes("aguardando devolução");
    }).length;
    
    // Contagem de itens devolvidos (RIC OK)
    const ricOk = filteredInventory.filter(item => {
      const status = normalizeStatus(item.status);
      return status.includes("ric ok") || status.includes("devolvido");
    }).length;

    // Contagem de itens de Baixa Pátio
    const totalBaixas = filteredInventory.filter(item => item.itemType === 'Baixa Pátio').length;
    
    return {
      totalItems,
      aguardandoDevolucao,
      ricOk,
      totalBaixas,
    };
  }, [filteredInventory]); // Depende do inventário filtrado

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Visão Geral</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI 1: Total de Containers (GLOBAL) */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
            <CardTitle className="text-xs font-medium">Containers Ativos (Total)</CardTitle>
            <Package className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-1 pt-0">
            <div className="text-sm font-bold">{containerStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {containerStats.devolvidos} devolvidos | {containerStats.pendentes} pendentes
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Containers Vencidos (GLOBAL) */}
        <Card className="border-l-4 border-l-danger">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
            <CardTitle className="text-xs font-medium">Containers Vencidos (Total)</CardTitle>
            <AlertTriangle className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-1 pt-0">
            <div className="text-sm font-bold text-danger">{containerStats.vencidos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Exigem atenção imediata
            </p>
          </CardContent>
        </Card>
        
        {/* KPI 3: RICs Devolvidas (FILTRADO) */}
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
            <CardTitle className="text-xs font-medium">RICs Devolvidas (Filtro)</CardTitle>
            <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-1 pt-0">
            <div className="text-sm font-bold">{inventoryStats.ricOk}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Itens com status RIC OK no filtro
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Pendentes de Devolução (FILTRADO) */}
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2">
            <CardTitle className="text-xs font-medium">Pendentes de Devolução (Filtro)</CardTitle>
            <Clock className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-1 pt-0">
            <div className="text-sm font-bold">{inventoryStats.aguardandoDevolucao}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Itens Aguardando Devolução no filtro
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}