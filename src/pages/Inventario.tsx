import { Container } from "@/types/container";
import { InventoryItem } from "@/types/inventory";
import { InventoryTable } from "@/components/InventoryTable";
import { AnaliseInventario } from "@/components/AnaliseInventario";
import { generateInventoryFromContainers } from "@/lib/inventoryGenerator";
import { useMemo, useState } from "react";
import { InventoryFilters } from "@/components/InventoryFilters";

interface InventarioProps {
  containers: Container[];
}

export default function Inventario({ containers }: InventarioProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [itemTypeFilter, setItemTypeFilter] = useState<InventoryItem['itemType'] | ''>("");
  const [statusFilter, setStatusFilter] = useState<InventoryItem['status'] | ''>("");
  
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
      if (itemTypeFilter && item.itemType !== itemTypeFilter) return false;

      // Filtro por Status
      if (statusFilter) {
        // Normaliza o status para comparação
        const itemStatusLower = String(item.status || '').toLowerCase();
        const filterStatusLower = String(statusFilter).toLowerCase();
        
        if (filterStatusLower === 'em uso' && !itemStatusLower.includes('em uso')) return false;
        if (filterStatusLower === 'aguardando devolução' && !itemStatusLower.includes('aguardando devolução')) return false;
        if (filterStatusLower === 'devolvido (ric ok)' && !itemStatusLower.includes('devolvido (ric ok)')) return false;
      }

      return true;
    });
  }, [inventory, searchTerm, itemTypeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventário Derivado de Containers</h1>
          <p className="text-muted-foreground mt-1">
            Rastreamento automático de itens de troca, baixa e devolução associados aos containers.
          </p>
        </div>
      </div>

      <AnaliseInventario containers={containers} inventory={inventory} />
      
      <InventoryFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        itemTypeFilter={itemTypeFilter}
        setItemTypeFilter={setItemTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <InventoryTable 
        inventory={filteredInventory} 
      />
    </div>
  );
}