import { InventoryItem } from "@/types/inventory";
import { InventoryTable } from "@/components/InventoryTable";
import { InventoryFormDialog } from "@/components/InventoryFormDialog";

interface InventarioProps {
  inventory: InventoryItem[];
  onItemAdd: (data: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  onItemEdit: (id: string, data: Partial<InventoryItem>) => void;
  onItemDelete: (id: string) => void;
}

export default function Inventario({ inventory, onItemAdd, onItemEdit, onItemDelete }: InventarioProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventário</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de itens e equipamentos relacionados aos containers.
          </p>
        </div>
        <InventoryFormDialog onSave={onItemAdd} />
      </div>

      <InventoryTable 
        inventory={inventory} 
        onItemEdit={onItemEdit} 
        onItemDelete={onItemDelete} 
      />
    </div>
  );
}