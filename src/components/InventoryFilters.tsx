import { Search, PackageOpen, CheckCircle2, Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryItem } from "@/types/inventory";

interface InventoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  itemTypeFilter: string;
  setItemTypeFilter: (type: InventoryItem['itemType'] | 'all') => void;
  statusFilter: string;
  setStatusFilter: (status: InventoryItem['status'] | 'all') => void;
}

// Corrigido: itemType agora inclui 'Troca'
const itemTypes: InventoryItem['itemType'][] = ['Troca', 'Baixa Pátio', 'Devolução'];
// Status atualizados para refletir a nova lógica de estoque
const statuses: InventoryItem['status'][] = ['Em Estoque', 'Aguardando Devolução', 'Devolvido (RIC OK)'];

export function InventoryFilters({
  searchTerm,
  setSearchTerm,
  itemTypeFilter,
  setItemTypeFilter,
  statusFilter,
  setStatusFilter,
}: InventoryFiltersProps) {

  const handleClearFilters = () => {
    setSearchTerm("");
    setItemTypeFilter("all"); // Usar 'all' como valor padrão/limpo
    setStatusFilter("all"); // Usar 'all' como valor padrão/limpo
  };

  // A pesquisa de texto livre (searchTerm) é gerenciada fora deste componente,
  // mas é usada para determinar se os filtros estão ativos.
  const isFiltered = searchTerm || (itemTypeFilter !== 'all') || (statusFilter !== 'all');

  return (
    <div className="flex flex-col sm:flex-row gap-1 flex-wrap"> {/* Reduzindo gap para 1 */}
      {/* Filtro por Tipo de Item */}
      <Select
        value={itemTypeFilter}
        onValueChange={(value: InventoryItem['itemType'] | 'all') => setItemTypeFilter(value)}
      >
        <SelectTrigger className="w-full sm:w-[140px] h-7 text-xs"> {/* Ajustando tamanho e altura */}
          <PackageOpen className="h-3 w-3 mr-1 text-muted-foreground" /> {/* Ajustando ícone */}
          <SelectValue placeholder="Filtrar por Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Tipos</SelectItem>
          {itemTypes.map(type => (
            <SelectItem key={type} value={type}>{type}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtro por Status */}
      <Select
        value={statusFilter}
        onValueChange={(value: InventoryItem['status'] | 'all') => setStatusFilter(value)}
      >
        <SelectTrigger className="w-full sm:w-[140px] h-7 text-xs"> {/* Ajustando tamanho e altura */}
          <CheckCircle2 className="h-3 w-3 mr-1 text-muted-foreground" /> {/* Ajustando ícone */}
          <SelectValue placeholder="Filtrar por Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          {statuses.map(status => (
            <SelectItem key={status} value={status}>{status}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Botão de Limpar Filtros */}
      {isFiltered && (
        <Button variant="outline" onClick={handleClearFilters} className="shrink-0 w-full sm:w-auto h-7 px-2 text-xs"> {/* Ajustando altura e fonte */}
          <X className="h-3 w-3 mr-1" /> {/* Ajustando ícone */}
          Limpar
        </Button>
      )}
    </div>
  );
}