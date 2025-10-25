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
  setItemTypeFilter: (type: InventoryItem['itemType'] | '') => void;
  statusFilter: string;
  setStatusFilter: (status: InventoryItem['status'] | '') => void;
}

const itemTypes: InventoryItem['itemType'][] = ['Troca', 'Baixa Pátio', 'Devolução'];
const statuses: InventoryItem['status'][] = ['Em Uso', 'Aguardando Devolução', 'Devolvido (RIC OK)'];

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
    setItemTypeFilter("");
    setStatusFilter("");
  };

  const isFiltered = searchTerm || itemTypeFilter || statusFilter;

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Pesquisa de Texto Livre */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por container, armador ou detalhes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtro por Tipo de Item */}
      <Select
        value={itemTypeFilter}
        onValueChange={(value: InventoryItem['itemType'] | '') => setItemTypeFilter(value)}
      >
        <SelectTrigger className="w-[180px]">
          <PackageOpen className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Filtrar por Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos os Tipos</SelectItem>
          {itemTypes.map(type => (
            <SelectItem key={type} value={type}>{type}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtro por Status */}
      <Select
        value={statusFilter}
        onValueChange={(value: InventoryItem['status'] | '') => setStatusFilter(value)}
      >
        <SelectTrigger className="w-[200px]">
          <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Filtrar por Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos os Status</SelectItem>
          {statuses.map(status => (
            <SelectItem key={status} value={status}>{status}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Botão de Limpar Filtros */}
      {isFiltered && (
        <Button variant="outline" onClick={handleClearFilters} className="shrink-0">
          <X className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      )}
    </div>
  );
}