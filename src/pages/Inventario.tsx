import { Container } from "@/types/container";
import { InventoryItem } from "@/types/inventory";
import { InventoryTable } from "@/components/InventoryTable";
import { AnaliseInventario } from "@/components/AnaliseInventario";
import { generateInventoryFromContainers } from "@/lib/inventoryGenerator";
import { useMemo } from "react";

interface InventarioProps {
  containers: Container[];
  // Handlers de CRUD removidos, pois o inventário é gerado automaticamente
}

export default function Inventario({ containers }: InventarioProps) {
  
  // Gera o inventário dinamicamente a partir dos containers
  const inventory: InventoryItem[] = useMemo(() => {
    return generateInventoryFromContainers(containers);
  }, [containers]);

  // Nota: O InventoryFormDialog e os handlers de CRUD foram removidos, pois o inventário é derivado.
  // Se o usuário precisar de um inventário manual, essa página precisará ser revertida.

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventário Derivado de Containers</h1>
          <p className="text-muted-foreground mt-1">
            Rastreamento automático de itens de troca, baixa e devolução associados aos containers.
          </p>
        </div>
        {/* Botão de Novo Item removido, pois o inventário é gerado */}
      </div>

      <AnaliseInventario containers={containers} inventory={inventory} />

      <InventoryTable 
        inventory={inventory} 
        // Handlers de edição e exclusão removidos
      />
    </div>
  );
}