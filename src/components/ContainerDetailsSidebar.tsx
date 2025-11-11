import { Container } from "@/types/container";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Package, Truck, Calendar, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadDialog } from "./FileUploadDialog";
import { ContainerFile } from "@/types/container";
import { cn } from "@/lib/utils";

interface ContainerDetailsSidebarProps {
  container: Container | null;
  onClose: () => void;
  onContainerUpdate: (containerId: string, files: ContainerFile[]) => void;
}

// Mapeamento dos campos para exibição em grupos lógicos
const FIELD_GROUPS = [
  {
    title: "Identificação e Entrada",
    icon: Package,
    fields: [
      { key: "container", label: "CONTAINER", highlight: true },
      { key: "armador", label: "ARMADOR", highlight: true },
      { key: "operador", label: "OPERADOR1" },
      { key: "motoristaEntrada", label: "MOTORISTA ENTRADA" },
      { key: "placa", label: "PLACA1" },
      { key: "dataEntrada", label: "DATA ENTRADA" },
      { key: "tara", label: "TARA (kg)" },
      { key: "mgw", label: "MGW (kg)" },
      { key: "tipo", label: "TIPO" },
      { key: "padrao", label: "PADRÃO" },
      { key: "statusVazioCheio", label: "STATUS (V/C)" },
    ],
  },
  {
    title: "Prazos e Clientes",
    icon: Calendar,
    fields: [
      { key: "dataPorto", label: "DATA PORTO" },
      { key: "freeTimeArmador", label: "FREE TIME ARMADOR (dias)" },
      { key: "demurrage", label: "DEMURRAGE" },
      { key: "prazoDias", label: "PRAZO (DIAS)", color: (d: number) => d === 0 ? "text-danger" : d <= 3 ? "text-warning" : "text-success" },
      { key: "clienteEntrada", label: "CLIENTE DE ENTRADA" },
      { key: "transportadora", label: "TRANSPORTADORA (Entrada)" },
      { key: "estoque", label: "ESTOQUE" },
    ],
  },
  {
    title: "Saída e Minuta",
    icon: Truck,
    fields: [
      { key: "transportadoraSaida", label: "TRANSPORTADORA (Saída)" },
      { key: "statusEntregaMinuta", label: "STATUS ENTREGA MINUTA" },
      { key: "statusMinuta", label: "STATUS MINUTA" },
      { key: "bookingAtrelado", label: "BOOKING ATRELADO" },
      { key: "lacre", label: "LACRE" },
      { key: "clienteSaidaDestino", label: "CLIENTE SAIDA / DESTINO" },
      { key: "atrelado", label: "ATRELADO" },
      { key: "operadorSaida", label: "OPERADOR (Saída)" },
      { key: "dataEstufagem", label: "DATA DA ESTUFAGEM" },
    ],
  },
  {
    title: "Baixa SJP e Status Geral",
    icon: Clock,
    fields: [
      { key: "dataSaidaSJP", label: "DATA SAIDA SJP" },
      { key: "motoristaSaidaSJP", label: "MOTORISTA SAIDA SJP" },
      { key: "placaSaida", label: "PLACA (Saída)" },
      { key: "status", label: "STATUS GERAL", highlight: true },
    ],
  },
];

export function ContainerDetailsSidebar({ container, onClose, onContainerUpdate }: ContainerDetailsSidebarProps) {
  const isOpen = !!container;

  if (!container) return null;

  const renderValue = (key: keyof Container, value: any, colorFn?: (d: any) => string) => {
    const displayValue = value === 0 ? "0" : (value || "-");
    
    let classes = "font-medium text-sm";
    if (colorFn) {
        classes = cn(classes, colorFn(value));
    }

    return <span className={classes}>{displayValue}</span>;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {container.container}
          </SheetTitle>
          <SheetDescription className="text-sm">
            Detalhes completos do container {container.armador}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Seção de Arquivos */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" /> Arquivos Anexados
            </h3>
            <FileUploadDialog
                containerId={container.id}
                files={container.files || []}
                onFilesChange={(files) => onContainerUpdate(container.id, files)}
            />
          </div>
          
          <Separator />

          {FIELD_GROUPS.map((group, index) => (
            <div key={index} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <group.icon className="h-4 w-4" /> {group.title}
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {group.fields.map((field) => {
                  const value = container[field.key as keyof Container];
                  return (
                    <div key={field.key} className="flex flex-col">
                      <span className="text-muted-foreground">{field.label}</span>
                      {renderValue(field.key as keyof Container, value, field.color)}
                    </div>
                  );
                })}
              </div>
              {index < FIELD_GROUPS.length - 1 && <Separator />}
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t">
            <Button onClick={onClose} className="w-full">
                Fechar
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}