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

  return (
    <Card className="border-0 shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Conteinner</TableHead>
              <TableHead className="font-semibold">Armador</TableHead>
              <TableHead className="font-semibold">Data Operação</TableHead>
              <TableHead className="font-semibold">Data Porto</TableHead>
              <TableHead className="font-semibold">Demurrage</TableHead>
              <TableHead className="font-semibold text-center">Free Time</TableHead>
              <TableHead className="font-semibold text-center">Dias Restantes</TableHead>
              <TableHead className="font-semibold">Placas</TableHead>
              <TableHead className="font-semibold">Motorista</TableHead>
              <TableHead className="font-semibold">Origem</TableHead>
              <TableHead className="font-semibold">Baixa Pátio SJP</TableHead>
              <TableHead className="font-semibold">Container Troca</TableHead>
              <TableHead className="font-semibold">Armador Troca</TableHead>
              <TableHead className="font-semibold">Depot Devolução</TableHead>
              <TableHead className="font-semibold">Data Devolução</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Arquivos</TableHead>
              <TableHead className="font-semibold text-center">Ações</TableHead>
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
                  <TableCell className="font-bold">{container.container}</TableCell>
                  <TableCell className="font-bold">{container.armador}</TableCell>
                  <TableCell>{container.dataOperacao}</TableCell>
                  <TableCell>{container.dataPorto}</TableCell>
                  <TableCell>{container.demurrage}</TableCell>
                  <TableCell className="text-center">{container.freeTime || "-"}</TableCell>
                  <TableCell className={`text-center ${getDiasRestantesColor(container.diasRestantes)}`}>
                    {container.diasRestantes}
                  </TableCell>
                  <TableCell>{container.placas}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{container.motorista}</TableCell>
                  <TableCell>{container.origem}</TableCell>
                  <TableCell>{container.baixaPatio || "-"}</TableCell>
                  <TableCell>{container.containerTroca || "-"}</TableCell>
                  <TableCell>{container.armadorTroca || "-"}</TableCell>
                  <TableCell>{container.depotDevolucao}</TableCell>
                  <TableCell>{container.dataDevolucao}</TableCell>
                  <TableCell>{getStatusBadge(container.status)}</TableCell>
                  <TableCell>
                    <FileUploadDialog
                      containerId={container.id}
                      files={container.files || []}
                      onFilesChange={(files) => onContainerUpdate(container.id, files)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-center">
                      <ContainerFormDialog
                        container={container}
                        onSave={(data) => onContainerEdit(container.id, data)}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
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