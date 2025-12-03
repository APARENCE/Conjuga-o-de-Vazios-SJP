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
import { Pencil, Trash2, AlertTriangle, XCircle } from "lucide-react";
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
import { formatDateToBR } from "@/lib/excelUtils";

interface ContainerTableProps {
  containers: Container[];
  onContainerUpdate: (containerId: string, files: ContainerFile[]) => void;
  onContainerEdit: (id: string, container: Partial<Container>) => void;
  onContainerDelete: (id: string) => void;
  onContainerSelect: (container: Container) => void;
}

export function ContainerTable({ containers, onContainerUpdate, onContainerEdit, onContainerDelete, onContainerSelect }: ContainerTableProps) {
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

  const getRowClass = (dias: number | string) => {
    if (typeof dias === "string") return "";
    if (dias === 0) return "bg-danger/10 hover:bg-danger/20";
    if (dias <= 3) return "bg-warning/10 hover:bg-warning/20";
    return "hover:bg-muted/30";
  };

  const fixedCellClasses = "sticky bg-background z-20"; 
  const fixedHeaderClasses = "sticky top-0 z-30 bg-muted/50 shadow-sm"; 
  const containerWidth = "w-[100px] min-w-[100px]";
  const armadorWidth = "w-[80px] min-w-[80px]";
  const containerLeft = "left-0";
  const armadorLeft = "left-[100px]";

  const colWidths = {
    xs: "w-[50px] min-w-[50px]", 
    sm: "w-[65px] min-w-[65px]", 
    md: "w-[80px] min-w-[80px]", 
    lg: "w-[100px] min-w-[100px]", 
  };
  
  // Classes de visibilidade responsiva
  const showOnLg = "hidden lg:table-cell";
  const showOnXl = "hidden xl:table-cell";
  const showOn2Xl = "hidden 2xl:table-cell";

  return (
    <Card className="border-0 shadow-sm">
      <div 
        className="overflow-x-auto" // Removendo overflow-y-auto e altura fixa
      >
        <Table className="compact-table">
          <TableHeader className={fixedHeaderClasses}>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {/* Colunas Essenciais (Sempre Visíveis) */}
              <TableHead className={cn("font-semibold z-[35]", containerLeft, containerWidth)}>CONTAINER</TableHead>
              <TableHead className={cn("font-semibold z-30", armadorLeft, armadorWidth)}>ARMADOR</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>PRAZO(DIAS)</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>STATUS GERAL</TableHead>
              
              {/* Colunas Importantes (Visíveis em Telas Maiores) */}
              <TableHead className={cn("font-semibold", colWidths.md, showOnLg)}>DATA ENTRADA</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md, showOnLg)}>CLIENTE ENTRADA</TableHead>
              <TableHead className={cn("font-semibold", colWidths.sm, showOnLg)}>PLACA1</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md, showOnXl)}>MOTORISTA ENTRADA</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md, showOnXl)}>DATA SAIDA SJP</TableHead>
              
              {/* Colunas de Detalhes (Visíveis em Telas Muito Grandes) */}
              <TableHead className={cn("font-semibold", colWidths.sm, showOn2Xl)}>OPERADOR1</TableHead>
              <TableHead className={cn("font-semibold", colWidths.xs, showOn2Xl)}>TARA</TableHead>
              <TableHead className={cn("font-semibold", colWidths.xs, showOn2Xl)}>MGW</TableHead>
              <TableHead className={cn("font-semibold", colWidths.xs, showOn2Xl)}>TIPO</TableHead>
              <TableHead className={cn("font-semibold", colWidths.xs, showOn2Xl)}>PADRÃO</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md, showOn2Xl)}>STATUS (V/C)</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md, showOn2Xl)}>DATA PORTO</TableHead>
              <TableHead className={cn("font-semibold text-center", colWidths.sm, showOn2Xl)}>FREE TIME</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md, showOn2Xl)}>DEMURRAGE</TableHead>
              <TableHead className={cn("font-semibold", colWidths.lg, showOn2Xl)}>TRANSPORTADORA (Entrada)</TableHead>
              <TableHead className={cn("font-semibold", colWidths.sm, showOn2Xl)}>ESTOQUE</TableHead>
              <TableHead className={cn("font-semibold", colWidths.lg, showOn2Xl)}>TRANSPORTADORA (Saída)</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md, showOn2Xl)}>STATUS ENTREGA MINUTA</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md, showOn2Xl)}>STATUS MINUTA</TableHead>
              <TableHead className={cn("font-semibold", colWidths.lg, showOn2Xl)}>BOOKING ATRELADO</TableHead>
              <TableHead className={cn("font-semibold", colWidths.xs, showOn2Xl)}>LACRE</TableHead>
              <TableHead className={cn("font-semibold", colWidths.lg, showOn2Xl)}>CLIENTE SAIDA / DESTINO</TableHead>
              <TableHead className={cn("font-semibold", colWidths.sm, showOn2Xl)}>ATRELADO</TableHead>
              <TableHead className={cn("font-semibold", colWidths.sm, showOn2Xl)}>OPERADOR (Saída)</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md, showOn2Xl)}>DATA ESTUFAGEM</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md, showOn2Xl)}>MOTORISTA SAIDA SJP</TableHead>
              <TableHead className={cn("font-semibold", colWidths.sm, showOn2Xl)}>PLACA (Saída)</TableHead>
              
              {/* Colunas de Ação (Sempre Visíveis) */}
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
              containers.map((container) => {
                return (
                  <TableRow 
                    key={container.id} 
                    className={cn("cursor-pointer", getRowClass(container.prazoDias))}
                    onClick={() => onContainerSelect(container)}
                  >
                    {/* Células Essenciais */}
                    <TableCell className={cn("font-bold z-[25]", containerLeft, fixedCellClasses, containerWidth)}>
                      {container.container}
                    </TableCell>
                    <TableCell className={cn("font-bold z-20", armadorLeft, fixedCellClasses, armadorWidth)}>
                      {container.armador}
                    </TableCell>
                    <TableCell className={cn("text-center", colWidths.md, getDiasRestantesColor(container.prazoDias))}>
                      <div className="flex items-center justify-center gap-1">
                          {getDiasRestantesIcon(container.prazoDias)}
                          {container.prazoDias}
                      </div>
                    </TableCell>
                    <TableCell className={colWidths.md}>{getStatusBadge(container.status)}</TableCell>
                    
                    {/* Células Importantes */}
                    <TableCell className={cn(colWidths.md, showOnLg)}>{formatDateToBR(container.dataEntrada)}</TableCell>
                    <TableCell className={cn(colWidths.md, "truncate", showOnLg)}>{container.clienteEntrada}</TableCell>
                    <TableCell className={cn(colWidths.sm, showOnLg)}>{container.placa}</TableCell>
                    <TableCell className={cn(colWidths.md, "truncate", showOnXl)}>{container.motoristaEntrada}</TableCell>
                    <TableCell className={cn(colWidths.md, showOnXl)}>{formatDateToBR(container.dataSaidaSJP)}</TableCell>
                    
                    {/* Células de Detalhes */}
                    <TableCell className={cn(colWidths.sm, showOn2Xl)}>{container.operador}</TableCell>
                    <TableCell className={cn(colWidths.xs, "text-right", showOn2Xl)}>{container.tara || "-"}</TableCell>
                    <TableCell className={cn(colWidths.xs, "text-right", showOn2Xl)}>{container.mgw || "-"}</TableCell>
                    <TableCell className={cn(colWidths.xs, showOn2Xl)}>{container.tipo}</TableCell>
                    <TableCell className={cn(colWidths.xs, showOn2Xl)}>{container.padrao}</TableCell>
                    <TableCell className={cn(colWidths.md, showOn2Xl)}>{container.statusVazioCheio}</TableCell>
                    <TableCell className={cn(colWidths.md, showOn2Xl)}>{formatDateToBR(container.dataPorto)}</TableCell>
                    <TableCell className={cn(colWidths.sm, "text-center", showOn2Xl)}>{container.freeTimeArmador || "-"}</TableCell>
                    <TableCell className={cn(colWidths.md, showOn2Xl)}>{container.demurrage}</TableCell>
                    <TableCell className={cn(colWidths.lg, "truncate", showOn2Xl)}>{container.transportadora}</TableCell>
                    <TableCell className={cn(colWidths.sm, showOn2Xl)}>{container.estoque}</TableCell>
                    <TableCell className={cn(colWidths.lg, "truncate", showOn2Xl)}>{container.transportadoraSaida}</TableCell>
                    <TableCell className={cn(colWidths.md, showOn2Xl)}>{container.statusEntregaMinuta}</TableCell>
                    <TableCell className={cn(colWidths.md, showOn2Xl)}>{container.statusMinuta}</TableCell>
                    <TableCell className={cn(colWidths.lg, "truncate", showOn2Xl)}>{container.bookingAtrelado}</TableCell>
                    <TableCell className={cn(colWidths.xs, showOn2Xl)}>{container.lacre}</TableCell>
                    <TableCell className={cn(colWidths.lg, "truncate", showOn2Xl)}>{container.clienteSaidaDestino}</TableCell>
                    <TableCell className={cn(colWidths.sm, showOn2Xl)}>{container.atrelado}</TableCell>
                    <TableCell className={cn(colWidths.sm, showOn2Xl)}>{container.operadorSaida}</TableCell>
                    <TableCell className={cn(colWidths.md, showOn2Xl)}>{formatDateToBR(container.dataEstufagem)}</TableCell>
                    <TableCell className={cn(colWidths.md, showOn2Xl)}>{container.motoristaSaidaSJP}</TableCell>
                    <TableCell className={cn(colWidths.sm, showOn2Xl)}>{container.placaSaida}</TableCell>
                    
                    {/* Células de Ação */}
                    <TableCell className="text-center w-[45px] min-w-[45px]" onClick={(e) => e.stopPropagation()}>
                      <FileUploadDialog
                        containerId={container.id}
                        files={container.files || []}
                        onFilesChange={(files) => onContainerUpdate(container.id, files)}
                      >
                        <Button variant="outline" size="icon" className="h-5 w-5 p-0">
                          <span className="text-xs">{container.files?.length || 0}</span>
                        </Button>
                      </FileUploadDialog>
                    </TableCell>
                    <TableCell className="w-[45px] min-w-[45px]" onClick={(e) => e.stopPropagation()}>
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}