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

  // Larguras OTIMIZADAS para as colunas fixas
  const containerWidth = "w-[100px] min-w-[100px]";
  const armadorWidth = "w-[80px] min-w-[80px]";
  const containerLeft = "left-0";
  const armadorLeft = "left-[100px]"; // Começa após a coluna Container (100px)

  // Larguras mínimas para colunas variáveis (ajustadas para melhor visualização)
  const colWidths = {
    xs: "w-[50px] min-w-[50px]", // Tara, MGW, Tipo, Padrão, Lacre
    sm: "w-[65px] min-w-[65px]", // Operador, Placa, Free Time, Estoque, Atrelado, Placa Saida
    md: "w-[80px] min-w-[80px]", // Datas, Status V/C, Demurrage, Prazo, Motorista, Cliente
    lg: "w-[100px] min-w-[100px]", // Transportadora, Status Minuta, Cliente Saida
  };

  return (
    <Card className="border-0 shadow-sm">
      {/* Contêiner de rolagem com altura máxima */}
      <div className="overflow-x-auto overflow-y-auto max-h-[75vh] lg:max-h-[85vh]">
        <Table className="compact-table">
          {/* TableHeader: Fixo no topo (Z-index 30) */}
          <TableHeader className={fixedHeaderClasses}>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {/* Colunas Fixas (Renderizadas primeiro, mas mapeadas para a 5ª e 6ª posição lógica) */}
              <TableHead className={cn("font-semibold z-[35]", containerLeft, containerWidth)}>CONTAINER</TableHead>
              <TableHead className={cn("font-semibold z-30", armadorLeft, armadorWidth)}>ARMADOR</TableHead>
              
              {/* Colunas Variáveis (Ordem da Planilha) */}
              <TableHead className={cn("font-semibold", colWidths.sm)}>OPERADOR1</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>MOTORISTA ENTRADA</TableHead>
              <TableHead className={cn("font-semibold", colWidths.sm)}>PLACA1</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>DATA ENTRADA</TableHead>
              {/* CONTAINER e ARMADOR são fixos, mas seus cabeçalhos não são repetidos aqui */}
              <TableHead className={cn("font-semibold", colWidths.xs)}>TARA</TableHead>
              <TableHead className={cn("font-semibold", colWidths.xs)}>MGW</TableHead>
              <TableHead className={cn("font-semibold", colWidths.xs)}>TIPO</TableHead>
              <TableHead className={cn("font-semibold", colWidths.xs)}>PADRÃO</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>STATUS (V/C)</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>DATA PORTO</TableHead>
              <TableHead className={cn("font-semibold text-center", colWidths.sm)}>FREE TIME</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>DEMURRAGE</TableHead>
              <TableHead className={cn("font-semibold text-center", colWidths.md)}>PRAZO(DIAS)</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>CLIENTE ENTRADA</TableHead>
              <TableHead className={cn("font-semibold", colWidths.lg)}>TRANSPORTADORA (Entrada)</TableHead>
              <TableHead className={cn("font-semibold", colWidths.sm)}>ESTOQUE</TableHead>
              <TableHead className={cn("font-semibold", colWidths.lg)}>TRANSPORTADORA (Saída)</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>STATUS ENTREGA MINUTA</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>STATUS MINUTA</TableHead>
              <TableHead className={cn("font-semibold", colWidths.lg)}>BOOKING ATRELADO</TableHead>
              <TableHead className={cn("font-semibold", colWidths.xs)}>LACRE</TableHead>
              <TableHead className={cn("font-semibold", colWidths.lg)}>CLIENTE SAIDA / DESTINO</TableHead>
              <TableHead className={cn("font-semibold", colWidths.sm)}>ATRELADO</TableHead>
              <TableHead className={cn("font-semibold", colWidths.sm)}>OPERADOR (Saída)</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>DATA ESTUFAGEM</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>DATA SAIDA SJP</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>MOTORISTA SAIDA SJP</TableHead>
              <TableHead className={cn("font-semibold", colWidths.sm)}>PLACA (Saída)</TableHead>
              <TableHead className={cn("font-semibold", colWidths.md)}>STATUS GERAL</TableHead>
              
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
                  {/* Colunas Fixas (Renderizadas primeiro) */}
                  <TableCell className={cn("font-bold z-[25]", containerLeft, fixedCellClasses, containerWidth)}>
                    {container.container}
                  </TableCell>
                  <TableCell className={cn("font-bold z-20", armadorLeft, fixedCellClasses, armadorWidth)}>
                    {container.armador}
                  </TableCell>
                  
                  {/* Colunas Variáveis (Ordem da Planilha) */}
                  <TableCell className={colWidths.sm}>{container.operador}</TableCell>
                  <TableCell className={cn(colWidths.md, "truncate")}>{container.motoristaEntrada}</TableCell>
                  <TableCell className={colWidths.sm}>{container.placa}</TableCell>
                  <TableCell className={colWidths.md}>{container.dataEntrada}</TableCell>
                  {/* CONTAINER e ARMADOR (5ª e 6ª colunas) são pulados aqui, pois foram renderizados como fixos */}
                  <TableCell className={cn(colWidths.xs, "text-right")}>{container.tara || "-"}</TableCell>
                  <TableCell className={cn(colWidths.xs, "text-right")}>{container.mgw || "-"}</TableCell>
                  <TableCell className={colWidths.xs}>{container.tipo}</TableCell>
                  <TableCell className={colWidths.xs}>{container.padrao}</TableCell>
                  <TableCell className={colWidths.md}>{container.statusVazioCheio}</TableCell>
                  <TableCell className={colWidths.md}>{container.dataPorto}</TableCell>
                  <TableCell className={cn(colWidths.sm, "text-center")}>{container.freeTimeArmador || "-"}</TableCell>
                  <TableCell className={colWidths.md}>{container.demurrage}</TableCell>
                  <TableCell className={cn("text-center", colWidths.md, getDiasRestantesColor(container.prazoDias))}>
                    <div className="flex items-center justify-center gap-1">
                        {getDiasRestantesIcon(container.prazoDias)}
                        {container.prazoDias}
                    </div>
                  </TableCell>
                  <TableCell className={cn(colWidths.md, "truncate")}>{container.clienteEntrada}</TableCell>
                  <TableCell className={cn(colWidths.lg, "truncate")}>{container.transportadora}</TableCell>
                  <TableCell className={colWidths.sm}>{container.estoque}</TableCell>
                  <TableCell className={cn(colWidths.lg, "truncate")}>{container.transportadoraSaida}</TableCell>
                  <TableCell className={colWidths.md}>{container.statusEntregaMinuta}</TableCell>
                  <TableCell className={colWidths.md}>{container.statusMinuta}</TableCell>
                  <TableCell className={cn(colWidths.lg, "truncate")}>{container.bookingAtrelado}</TableCell>
                  <TableCell className={colWidths.xs}>{container.lacre}</TableCell>
                  <TableCell className={cn(colWidths.lg, "truncate")}>{container.clienteSaidaDestino}</TableCell>
                  <TableCell className={colWidths.sm}>{container.atrelado}</TableCell>
                  <TableCell className={colWidths.sm}>{container.operadorSaida}</TableCell>
                  <TableCell className={colWidths.md}>{container.dataEstufagem}</TableCell>
                  <TableCell className={colWidths.md}>{container.dataSaidaSJP}</TableCell>
                  <TableCell className={cn(colWidths.md, "truncate")}>{container.motoristaSaidaSJP}</TableCell>
                  <TableCell className={colWidths.sm}>{container.placaSaida}</TableCell>
                  <TableCell className={colWidths.md}>{getStatusBadge(container.status)}</TableCell>
                  
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