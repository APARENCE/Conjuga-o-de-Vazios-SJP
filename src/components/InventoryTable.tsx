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
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Package } from "lucide-react";
import { InventoryFormDialog } from "@/components/InventoryFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface InventoryTableProps {
  inventory: InventoryItem[];
  onItemEdit: (id: string, data: Partial<InventoryItem>) => void;
  onItemDelete: (id: string) => void;
}

export function InventoryTable({ inventory, onItemEdit, onItemDelete }: InventoryTableProps) {
  return (
    <Card className="border-0 shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Nome do Item</TableHead>
              <TableHead className="font-semibold">SKU</TableHead>
              <TableHead className="font-semibold text-center">Quantidade</TableHead>
              <TableHead className="font-semibold">Localização</TableHead>
              <TableHead className="font-semibold">Última Atualização</TableHead>
              <TableHead className="font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nenhum item no inventário. Adicione um novo item para começar.
                </TableCell>
              </TableRow>
            ) : (
              inventory.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell className="text-center font-bold text-primary">{item.quantity}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>{new Date(item.lastUpdated).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-center">
                      <InventoryFormDialog
                        item={item}
                        onSave={(data) => onItemEdit(item.id, data)}
                        trigger={
                          <Button variant="ghost" size="sm" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" title="Excluir">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o item "{item.name}" (SKU: {item.sku})? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onItemDelete(item.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}