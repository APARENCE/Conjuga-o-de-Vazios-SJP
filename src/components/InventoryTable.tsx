import { InventoryItem } from "@/types/inventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InventoryTableProps {
  inventory: InventoryItem[];
  // onItemEdit e onItemDelete removidos
}

export function InventoryTable({ inventory }: InventoryTableProps) {
  
  const getStatusBadge = (status: string | undefined) => {
    const statusLower = String(status || '').toLowerCase();
    
    if (statusLower.includes("ric ok") || statusLower.includes("devolvido")) {
      return <Badge className="bg-success text-white hover:bg-success/80">Devolvido (RIC OK)</Badge>;
    }
    if (statusLower.includes("aguardando devolução")) {
      return <Badge className="bg-warning text-white hover:bg-warning/80">Aguardando Devolução</Badge>;
    }
    if (statusLower.includes("em uso")) {
      return <Badge variant="secondary">Em Uso</Badge>;
    }
    return <Badge variant="outline">{status || 'Outro'}</Badge>;
  };

  return (
    <Card className="border-0 shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Container</TableHead>
              <TableHead className="font-semibold">Armador</TableHead>
              <TableHead className="font-semibold">Tipo de Item</TableHead>
              <TableHead className="font-semibold">Detalhes</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Última Atualização</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nenhum item de inventário gerado a partir dos containers.
                </TableCell>
              </TableRow>
            ) : (
              inventory.map((item) => (
                <TableRow key={item.id + item.itemType} className="hover:bg-muted/30">
                  <TableCell className="font-bold">{item.container}</TableCell>
                  <TableCell>{item.armador}</TableCell>
                  <TableCell className="font-medium">{item.itemType}</TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">{item.details}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{new Date(item.lastUpdated).toLocaleString('pt-BR')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}