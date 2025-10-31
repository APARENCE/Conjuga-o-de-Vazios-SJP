import { Container, ContainerFile } from "@/types/container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FileUploadDialog } from "@/components/FileUploadDialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { ContainerFormDialog } from "@/components/ContainerFormDialog";
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
import { cn } from "@/lib/utils";

interface ContainerTableProps {
  containers: Container[];
  onContainerUpdate: (containerId: string, files: ContainerFile[]) => void;
  onContainerEdit: (id: string, container: Partial<Container>) => void;
  onContainerDelete: (id: string) => void;
}

export function ContainerTable({ containers, onContainerUpdate, onContainerEdit, onContainerDelete }: ContainerTableProps) {
  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="secondary">-</Badge>;
    const statusLower = String(status).toLowerCase();
    if (statusLower.includes("ok") || statusLower.includes("devolvido")) {
      return <Badge className="bg-success text-white">{status}</Badge>;
    }
    if (statusLower.includes("aguardando") || statusLower.includes("verificar")) {
      return <Badge className="bg-warning text-white">{status}</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getDiasRestantesColor = (dias: number | string) => {
    if (typeof dias === "string") return "text-muted-foreground";
    if (dias === 0) return "text-danger font-semibold";
    if (dias <= 3) return "text-warning font-semibold";
    return "text-success";
  };

  // Classes para colunas fixas (rolagem horizontal)
  const fixedCellClasses = "sticky bg-background z-20"; 
  
  // Classes para o cabeçalho fixo (rolagem vertical)
  const fixedHeaderClasses = "sticky top-0 z-30 bg-muted/50 shadow-sm"; 

  // Larguras fixas para as colunas fixas (MÁXIMA REDUÇÃO)
  const containerWidth = "w-[90px] min-w-[90px]";
  const armadorWidth = "w-[70px] min-w-[70px]";
  const armadorLeft = "left-[90px]"; // Começa após a coluna Container (90px)

  return (
    <Card className="border-0 shadow-sm">
      {/* Contêiner de rolagem com altura máxima */}
      <div className="overflow-x-auto overflow-y-auto max-h-[75vh] lg:max-h-[85vh]">
        <Table className="compact-table">
          {/* TableHeader: Fixo no topo (Z-index 30) */}
          <TableHeader className={fixedHeaderClasses}>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {/* Coluna 1: Container (Fixo na esquerda, Z-index 35 para sobrepor a Armador) */}
              <TableHead className={cn("font-semibold left-0 z-[35]", containerWidth)}>Container</TableHead>
              
              {/* Coluna 2: Armador (Fixo na esquerda, deslocado, Z-index 30) */}
              <TableHead className={cn("font-semibold z-30", armadorLeft, armadorWidth)}>Armador</TableHead>
              
              <TableHead className="font-semibold w-[75px] min-w-[75px]">Data Op</TableHead>
              <TableHead className="font-semibold w-[75px] min-w-[75px]">Data Porto</TableHead>
              <TableHead className="font-semibold w-[75px] min-w-[75px]">Demurrage</TableHead>
              <TableHead className="font-semibold text-center w-[50px] min-w-[50px]">Free Time</TableHead>
              <TableHead className="font-semibold text-center w-[70px] min-w-[70px]">Dias Restantes</TableHead>
              <TableHead className="font-semibold w-[60px] min-w-[60px]">Placas</TableHead>
              <TableHead className="font-semibold w-[80px] min-w-[80px]">Motorista</TableHead>
              <TableHead className="font-semibold w-[60px] min-w-[60px]">Origem</TableHead>
              <TableHead className="font-semibold w-[75px] min-w-[75px]">Baixa Pátio</TableHead>
              <TableHead className="font-semibold w-[80px] min-w-[80px]">Cont. Troca</TableHead>
              <TableHead className="font-semibold w-[70px] min-w-[70px]">Arm. Troca</TableHead>
              <TableHead className="font-semibold w-[80px] min-w-[80px]">Depot Dev.</TableHead>
              <TableHead className="font-semibold w-[75px] min-w-[75px]">Data Dev.</TableHead>
              <TableHead className="font-semibold w-[80px] min-w-[80px]">Status</TableHead>
              <TableHead className="font-semibold text-center w-[50px] min-w-[50px]">Arquivos</TableHead>
              <TableHead className="font-semibold text-center w-[50px] min-w-[50px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {containers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={18} className="text-center py-8 text-muted-foreground">
                  Nenhum container encontrado. Importe uma planilha para começar.
                </TableCell>
              </TableRow>
            ) : (
              containers.map((container) => (
                <TableRow key={container.id} className="hover:bg-muted/30">
                  {/* Coluna 1: Container (Fixo na esquerda, Z-index 25 para sobrepor Armador) */}
                  <TableCell className={cn("font-bold left-0 z-[25]", fixedCellClasses, containerWidth)}>
                    {container.container}
                  </TableCell>
                  
                  {/* Coluna 2: Armador (Fixo na esquerda, deslocado, Z-index 20) */}
                  <TableCell className={cn("font-bold z-20", armadorLeft, fixedCellClasses, armadorWidth)}>
                    {container.armador}
                  </TableCell>
                  
                  <TableCell className="w-[75px] min-w-[75px]">{container.dataOperacao}</TableCell>
                  <TableCell className="w-[75px] min-w-[75px]">{container.dataPorto}</TableCell>
                  <TableCell className="w-[75px] min-w-[75px]">{container.demurrage}</TableCell>
                  <TableCell className="text-center w-[50px] min-w-[50px]">{container.freeTime || "-"}</TableCell>
                  <TableCell className={cn("text-center w-[70px] min-w-[70px]", getDiasRestantesColor(container.diasRestantes))}>
                    {container.diasRestantes}
                  </TableCell>
                  <TableCell className="w-[60px] min-w-[60px]">{container.placas}</TableCell>
                  <TableCell className="w-[80px] min-w-[80px] truncate">{container.motorista}</TableCell>
                  <TableCell className="w-[60px] min-w-[60px]">{container.origem}</TableCell>
                  <TableCell className="w-[75px] min-w-[75px]">{container.baixaPatio || "-"}</TableCell>
                  <TableCell className="w-[80px] min-w-[80px]">{container.containerTroca || "-"}</TableCell>
                  <TableCell className="w-[70px] min-w-[70px]">{container.armadorTroca || "-"}</TableCell>
                  <TableCell className="w-[80px] min-w-[80px]">{container.depotDevolucao}</TableCell>
                  <TableCell className="w-[75px] min-w-[75px]">{container.dataDevolucao}</TableCell>
                  <TableCell className="w-[80px] min-w-[80px]">{getStatusBadge(container.status)}</TableCell>
                  <TableCell className="text-center w-[50px] min-w-[50px]">
                    <FileUploadDialog
                      containerId={container.id}
                      files={container.files || []}
                      onFilesChange={(files) => onContainerUpdate(container.id, files)}
                      trigger={
                        <Button variant="outline" size="icon" className="h-5 w-5 p-0">
                          <span className="text-xs">{container.files?.length || 0}</span>
                        </Button>
                      }
                    />
                  </TableCell>
                  <TableCell className="w-[50px] min-w-[50px]">
                    <div className="flex items-center gap-0.5 justify-center">
                      <ContainerFormDialog
                        container={container}
                        onSave={(data) => onContainerEdit(container.id, data)}
                        trigger={
                          <Button variant="ghost" size="icon" title="Editar" className="h-5 w-5 p-0">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        }
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Excluir" className="h-5 w-5 p-0">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o container {container.container}? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onContainerDelete(container.id)}
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