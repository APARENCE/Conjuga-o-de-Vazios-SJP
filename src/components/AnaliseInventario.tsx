import { Container } from "@/types/container";
import { InventoryItem } from "@/types/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, CheckCircle2, Clock, Warehouse } from "lucide-react";
import { useMemo } from "react";

interface AnaliseInventarioProps {
  containers: Container[];
  inventory: InventoryItem[];
}

export function AnaliseInventario({ containers, inventory }: AnaliseInventarioProps) {
  
  // --- Análise de Containers (Reutilizando lógica de Containers.tsx/Analise.tsx) ---
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
      const dias = typeof c.diasRestantes === 'number' ? c.diasRestantes : 0;
      return dias === 0;
    }).length;

    return {
      total: containers.length,
      devolvidos,
      pendentes,
      vencidos,
    };
  }, [containers]);

  // --- Análise de Inventário ---
  const inventoryStats = useMemo(() => {
    const totalItems = inventory.length;
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    
    // Contagem de itens em estoque/uso (Em Estoque OU Aguardando Devolução)
    const emEstoque = inventory.filter(item => 
      String(item.status).toLowerCase() === "em estoque" || 
      String(item.status).toLowerCase() === "aguardando devolução"
    ).length;
    
    // Contagem de itens devolvidos (RIC OK)
    const devolvidos = inventory.filter(item => 
      String(item.status).toLowerCase() === "ric ok"
    ).length;

    return {
      totalItems,
      totalQuantity,
      emEstoque,
      devolvidos,
    };
  }, [inventory]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Visão Geral</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI 1: Total de Containers */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Containers Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{containerStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {containerStats.devolvidos} devolvidos | {containerStats.pendentes} pendentes
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Containers Vencidos */}
        <Card className="border-l-4 border-l-danger">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Containers Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-danger">{containerStats.vencidos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Exigem atenção imediata
            </p>
          </CardContent>
        </Card>
        
        {/* KPI 3: Itens de Inventário em Estoque/Uso */}
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens em Estoque/Uso</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inventoryStats.emEstoque}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {inventoryStats.totalQuantity} unidades no total
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Itens de Inventário Devolvidos (RIC OK) */}
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Devolvidos (RIC OK)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inventoryStats.devolvidos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Itens com status RIC OK
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}