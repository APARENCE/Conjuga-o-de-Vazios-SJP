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

  // Classes para colunas fixas
  const fixedColumnClasses = "sticky bg-background z-20"; 
  // Ajustando fixedHeaderClasses para garantir que o fundo do cabeçalho fixo seja opaco
  const fixedHeaderClasses = "sticky top-0 z-30 bg-muted/50 shadow-sm"; 

  // Larguras fixas para as colunas fixas
  const containerWidth = "w-[140px] min-w-[140px]";
  const armadorWidth = "w-[120px] min-w-[120px]";
  const armadorLeft = "left-[140px]"; // Começa após a coluna Container (140px)

  return (
    <Card className="border-0 shadow-sm">
      {/* Adicionando altura máxima para forçar a rolagem interna e fixar o cabeçalho */}
      <div className="overflow-x-auto overflow-y-auto max-h-[75vh] lg:max-h-[85vh]">
        <Table className="compact-table"> {/* Aplicando classe de tabela compacta */}
          {/* Aplicamos sticky, top-0 e bg-background ao TableHeader */}
          <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {/* Coluna 1: Container (Fixo na esquerda) */}
              <TableHead className={cn("font-semibold left-0", fixedHeaderClasses, containerWidth)}>Container</TableHead>
              
              {/* Coluna 2: Armador (Fixo na esquerda, deslocado) */}
              <TableHead className={cn("font-semibold", armadorLeft, fixedHeaderClasses, armadorWidth)}>Armador</TableHead>
              
              <TableHead className="font-semibold w-[120px] min-w-[120px]">Data Operação</TableHead>
              <TableHead className="font-semibold w-[120px] min-w-[120px]">Data Porto</TableHead>
              <TableHead className="font-semibold w-[120px] min-w-[120px]">Demurrage</TableHead>
              <TableHead className="font-semibold text-center w-[100px] min-w-[100px]">Free Time</TableHead>
              <TableHead className="font-semibold text-center w-[120px] min-w-[120px]">Dias Restantes</TableHead>
              <TableHead className="font-semibold w-[100px] min-w-[100px]">Placas</TableHead>
              <TableHead className="font-semibold w-[150px] min-w-[150px]">Motorista</TableHead>
              <TableHead className="font-semibold w-[100px] min-w-[100px]">Origem</TableHead>
              <TableHead className="font-semibold w-[120px] min-w-[120px]">Baixa Pátio SJP</TableHead>
              <TableHead className="font-semibold w-[140px] min-w-[140px]">Container Troca</TableHead>
              <TableHead className="font-semibold w-[120px] min-w-[120px]">Armador Troca</TableHead>
              <TableHead className="font-semibold w-[150px] min-w-[150px]">Depot Devolução</TableHead>
              <TableHead className="font-semibold w-[120px] min-w-[120px]">Data Devolução</TableHead>
              <TableHead className="font-semibold w-[150px] min-w-[150px]">Status</TableHead>
              <TableHead className="font-semibold text-center w-[100px] min-w-[100px]">Arquivos</TableHead>
              <TableHead className="font-semibold text-center w-[100px] min-w-[100px]">Ações</TableHead>
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
                  {/* Coluna 1: Container (Fixo na esquerda) */}
                  <TableCell className={cn("font-bold left-0", fixedColumnClasses, containerWidth)}>
                    {container.container}
                  </TableCell>
                  
                  {/* Coluna 2: Armador (Fixo na esquerda, deslocado) */}
                  <TableCell className={cn("font-bold", armadorLeft, fixedColumnClasses, armadorWidth)}>
                    {container.armador}
                  </TableCell>
                  
                  <TableCell className="w-[120px] min-w-[120px]">{container.dataOperacao}</TableCell>
                  <TableCell className="w-[120px] min-w-[120px]">{container.dataPorto}</TableCell>
                  <TableCell className="w-[120px] min-w-[120px]">{container.demurrage}</TableCell>
                  <TableCell className="text-center w-[100px] min-w-[100px]">{container.freeTime || "-"}</TableCell>
                  <TableCell className={cn("text-center w-[120px] min-w-[120px]", getDiasRestantesColor(container.diasRestantes))}>
                    {container.diasRestantes}
                  </TableCell>
                  <TableCell className="w-[100px] min-w-[100px]">{container.placas}</TableCell>
                  <TableCell className="w-[150px] min-w-[150px] truncate">{container.motorista}</TableCell>
                  <TableCell className="w-[100px] min-w-[100px]">{container.origem}</TableCell>
                  <TableCell className="w-[120px] min-w-[120px]">{container.baixaPatio || "-"}</TableCell>
                  <TableCell className="w-[140px] min-w-[140px]">{container.containerTroca || "-"}</TableCell>
                  <TableCell className="w-[120px] min-w-[120px]">{container.armadorTroca || "-"}</TableCell>
                  <TableCell className="w-[150px] min-w-[150px]">{container.depotDevolucao}</TableCell>
                  <TableCell className="w-[120px] min-w-[120px]">{container.dataDevolucao}</TableCell>
                  <TableCell className="w-[150px] min-w-[150px]">{getStatusBadge(container.status)}</TableCell>
                  <TableCell className="text-center w-[100px] min-w-[100px]">
                    <FileUploadDialog
                      containerId={container.id}
                      files={container.files || []}
                      onFilesChange={(files) => onContainerUpdate(container.id, files)}
                    />
                  </TableCell>
                  <TableCell className="w-[100px] min-w-[100px]">
                    <div className="flex items-center gap-2 justify-center">
                      <ContainerFormDialog
                        container={container}
                        onSave={(data) => onContainerEdit(container.id, data)}
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