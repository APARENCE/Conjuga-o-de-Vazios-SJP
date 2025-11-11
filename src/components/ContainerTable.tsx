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
import { Pencil, Trash2, AlertTriangle, XCircle, Clock } from "lucide-react";
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
  
  const getDiasRestantesIcon = (dias: number | string) => {
    if (typeof dias === "string") return null;
    if (dias === 0) return <XCircle className="h-3 w-3 text-danger shrink-0" />;
    if (dias <= 3) return <AlertTriangle className="h-3 w-3 text-warning shrink-0" />;
    return null;
  };

  // Classes para colunas fixas (rolagem horizontal)
  const fixedCellClasses = "sticky bg-background z-20"; 
  
  // Classes para o cabeçalho fixo (rolagem vertical)
  const fixedHeaderClasses = "sticky top-0 z-30 bg-muted/50 shadow-sm"; 

  // Larguras fixas para as colunas fixas (MÁXIMA REDUÇÃO)
  const containerWidth = "w-[85px] min-w-[85px]";
  const armadorWidth = "w-[65px] min-w-[65px]";
  const armadorLeft = "left-[85px]"; // Começa após a coluna Container (85px)

  return (
    <Card className="border-0 shadow-sm">
      {/* Contêiner de rolagem com altura máxima */}
      <div className="overflow-x-auto overflow-y-auto max-h-[75vh] lg:max-h-[85vh]">
        <Table className="compact-table">
          {/* TableHeader: Fixo no topo (Z-index 30) */}
          <TableHeader className={fixedHeaderClasses}>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {/* Colunas Fixas (Container e Armador) */}
              <TableHead className={cn("font-semibold left-0 z-[35]", containerWidth)}>CONTAINER</TableHead>
              <TableHead className={cn("font-semibold z-30", armadorLeft, armadorWidth)}>ARMADOR</TableHead>
              
              {/* Colunas Variáveis (Ordem da Planilha) */}
              <TableHead className="font-semibold w-[60px] min-w-[60px]">OPERADOR</TableHead>
              <TableHead className="font-semibold w-[80px] min-w-[80px]">MOTORISTA ENTRADA</TableHead>
              <TableHead className="font-semibold w-[55px] min-w-[55px]">PLACA</TableHead>
              <TableHead className="font-semibold w-[70px] min-w-[70px]">DATA ENTRADA</TableHead>
              <TableHead className="font-semibold w-[50px] min-w-[50px]">TARA</TableHead>
              <TableHead className="font-semibold w-[50px] min-w-[50px]">MGW</TableHead>
              <TableHead className="font-semibold w-[50px] min-w-[50px]">TIPO</TableHead>
              <TableHead className="font-semibold w-[50px] min-w-[50px]">PADRÃO</TableHead>
              <TableHead className="font-semibold w-[70px] min-w-[70px]">STATUS (V/C)</TableHead>
              <TableHead className="font-semibold w-[70px] min-w-[70px]">DATA PORTO</TableHead>
              <TableHead className="font-semibold w-[60px] min-w-[60px]">FREE TIME</TableHead>
              <TableHead className="font-semibold w-[70px] min-w-[70px]">DEMURRAGE</TableHead>
              <TableHead className="font-semibold text-center w-[65px] min-w-[65px]">PRAZO(DIAS)</TableHead>
              <TableHead className="font-semibold w-[80px] min-w-[80px]">CLIENTE ENTRADA</TableHead>
              <TableHead className="font-semibold w-[80px] min-w-[80px]">TRANSPORTADORA</TableHead>
              <TableHead className="font-semibold w-[60px] min-w-[60px]">ESTOQUE</TableHead>
              <TableHead className="font-semibold w-[80px] min-w-[80px]">TRANSPORTADORA SAIDA</TableHead>
              <TableHead className="font-semibold w-[70px] min-w-[70px]">STATUS ENTREGA MINUTA</TableHead>
              <TableHead className="font-semibold w-[70px] min-w-[70px]">STATUS MINUTA</TableHead>
              <TableHead className="font-semibold w-[80px] min-w-[80px]">BOOKING ATRELADO</TableHead>
              <TableHead className="font-semibold w-[50px] min-w-[50px]">LACRE</TableHead>
              <TableHead className="font-semibold w-[80px] min-w-[80px]">CLIENTE SAIDA / DESTINO</TableHead>
              <TableHead className="font-semibold w-[60px] min-w-[60px]">ATRELADO</TableHead>
              <TableHead className="font-semibold w-[60px] min-w-[60px]">OPERADOR SAIDA</TableHead>
              <TableHead className="font-semibold w-[70px] min-w-[70px]">DATA ESTUFAGEM</TableHead>
              <TableHead className="font-semibold w-[70px] min-w-[70px]">DATA SAIDA SJP</TableHead>
              <TableHead className="font-semibold w-[80px] min-w-[80px]">MOTORISTA SAIDA SJP</TableHead>
              <TableHead className="font-semibold w-[55px] min-w-[55px]">PLACA SAIDA</TableHead>
              <TableHead className="font-semibold w-[75px] min-w-[75px]">STATUS GERAL</TableHead>
              
              {/* Colunas de Ação */}
              <TableHead className="font-semibold text-center w-[45px] min-w-[45px]">Arquivos</TableHead>
              <TableHead className="font-semibold text-center w-[45px] min-w-[45px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {containers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={33} className="text-center py-8 text-muted-foreground">
                  Nenhum container encontrado. Importe uma planilha para começar.
                </TableCell>
              </TableRow>
            ) : (
              containers.map((container) => (
                <TableRow key={container.id} className="hover:bg-muted/30">
                  {/* Colunas Fixas */}
                  <TableCell className={cn("font-bold left-0 z-[25]", fixedCellClasses, containerWidth)}>
                    {container.container}
                  </TableCell>
                  <TableCell className={cn("font-bold z-20", armadorLeft, fixedCellClasses, armadorWidth)}>
                    {container.armador}
                  </TableCell>
                  
                  {/* Colunas Variáveis (Ordem da Planilha) */}
                  <TableCell className="w-[60px] min-w-[60px]">{container.operador}</TableCell>
                  <TableCell className="w-[80px] min-w-[80px] truncate">{container.motoristaEntrada}</TableCell>
                  <TableCell className="w-[55px] min-w-[55px]">{container.placa}</TableCell>
                  <TableCell className="w-[70px] min-w-[70px]">{container.dataEntrada}</TableCell>
                  <TableCell className="w-[50px] min-w-[50px] text-right">{container.tara || "-"}</TableCell>
                  <TableCell className="w-[50px] min-w-[50px] text-right">{container.mgw || "-"}</TableCell>
                  <TableCell className="w-[50px] min-w-[50px]">{container.tipo}</TableCell>
                  <TableCell className="w-[50px] min-w-[50px]">{container.padrao}</TableCell>
                  <TableCell className="w-[70px] min-w-[70px]">{container.statusVazioCheio}</TableCell>
                  <TableCell className="w-[70px] min-w-[70px]">{container.dataPorto}</TableCell>
                  <TableCell className="w-[60px] min-w-[60px] text-center">{container.freeTimeArmador || "-"}</TableCell>
                  <TableCell className="w-[70px] min-w-[70px]">{container.demurrage}</TableCell>
                  <TableCell className={cn("text-center w-[65px] min-w-[65px]", getDiasRestantesColor(container.prazoDias))}>
                    <div className="flex items-center justify-center gap-1">
                        {getDiasRestantesIcon(container.prazoDias)}
                        {container.prazoDias}
                    </div>
                  </TableCell>
                  <TableCell className="w-[80px] min-w-[80px] truncate">{container.clienteEntrada}</TableCell>
                  <TableCell className="w-[80px] min-w-[80px] truncate">{container.transportadora}</TableCell>
                  <TableCell className="w-[60px] min-w-[60px]">{container.estoque}</TableCell>
                  <TableCell className="w-[80px] min-w-[80px] truncate">{container.transportadoraSaida}</TableCell>
                  <TableCell className="w-[70px] min-w-[70px]">{container.statusEntregaMinuta}</TableCell>
                  <TableCell className="w-[70px] min-w-[70px]">{container.statusMinuta}</TableCell>
                  <TableCell className="w-[80px] min-w-[80px] truncate">{container.bookingAtrelado}</TableCell>
                  <TableCell className="w-[50px] min-w-[50px]">{container.lacre}</TableCell>
                  <TableCell className="w-[80px] min-w-[80px] truncate">{container.clienteSaidaDestino}</TableCell>
                  <TableCell className="w-[60px] min-w-[60px]">{container.atrelado}</TableCell>
                  <TableCell className="w-[60px] min-w-[60px]">{container.operadorSaida}</TableCell>
                  <TableCell className="w-[70px] min-w-[70px]">{container.dataEstufagem}</TableCell>
                  <TableCell className="w-[70px] min-w-[70px]">{container.dataSaidaSJP}</TableCell>
                  <TableCell className="w-[80px] min-w-[80px] truncate">{container.motoristaSaidaSJP}</TableCell>
                  <TableCell className="w-[55px] min-w-[55px]">{container.placaSaida}</TableCell>
                  <TableCell className="w-[75px] min-w-[75px]">{getStatusBadge(container.status)}</TableCell>
                  
                  {/* Colunas de Ação */}
                  <TableCell className="text-center w-[45px] min-w-[45px]">
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
                  <TableCell className="w-[45px] min-w-[45px]">
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