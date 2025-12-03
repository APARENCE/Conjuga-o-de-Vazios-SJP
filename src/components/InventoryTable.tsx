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
import React from "react";

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
    if (statusLower.includes("em estoque")) {
      return <Badge className="bg-primary text-white hover:bg-primary/90">Em Estoque</Badge>;
    }
    return <Badge variant="outline">{status || 'Outro'}</Badge>;
  };

  return (
    <Card className="border-0 shadow-sm">
      {/* Adicionando altura máxima para rolagem interna e fixar o cabeçalho */}
      <div 
        className="overflow-x-auto overflow-y-auto max-h-[75vh] lg:max-h-[85vh]"
        style={{ height: 'calc(75vh - 40px)' }} // Altura ajustada para o contêiner de rolagem
      >
        <Table className="compact-table"> {/* Aplicando classe de tabela compacta */}
          <TableHeader className="sticky top-0 z-10 bg-muted/50 shadow-sm">
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold min-w-[90px]">Container</TableHead>
              <TableHead className="font-semibold min-w-[70px]">Armador</TableHead>
              <TableHead className="font-semibold min-w-[70px]">Tipo de Item</TableHead>
              <TableHead className="font-semibold min-w-[180px]">Detalhes</TableHead> {/* Reduzido para 180px */}
              <TableHead className="font-semibold min-w-[80px]">Status</TableHead>
              <TableHead className="font-semibold min-w-[90px]">Última Atualização</TableHead>
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
              inventory.map((item) => {
                
                return (
                  <TableRow 
                    key={item.id + item.itemType} 
                    className="hover:bg-muted/30"
                  >
                    <TableCell className="font-bold min-w-[90px]">{item.container}</TableCell>
                    <TableCell className="min-w-[70px]">{item.armador}</TableCell>
                    <TableCell className="font-medium min-w-[70px]">{item.itemType}</TableCell>
                    <TableCell className="max-w-[400px] truncate text-sm text-muted-foreground min-w-[180px]">{item.details}</TableCell> {/* Ajustado min-w */}
                    <TableCell className="min-w-[80px]">{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="min-w-[90px]">{new Date(item.lastUpdated).toLocaleString('pt-BR')}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}