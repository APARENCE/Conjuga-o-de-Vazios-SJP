import { useState, useEffect } from "react";
import { Container } from "@/types/container";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Package, Calendar, Truck, Clock, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  TIPO_OPTIONS,
  PADRAO_OPTIONS,
  STATUS_VAZIO_CHEIO_OPTIONS,
  ESTOQUE_OPTIONS,
  STATUS_ENTREGA_MINUTA_OPTIONS,
  STATUS_MINUTA_OPTIONS,
  STATUS_GERAL_OPTIONS,
} from "@/data/formOptions";
import { cn } from "@/lib/utils";

// --- Esquema de Validação Zod ---
const ContainerSchema = z.object({
  // Seção 1: Entrada e Identificação
  operador: z.string().optional(),
  motoristaEntrada: z.string().optional(),
  placa: z.string().optional(),
  dataEntrada: z.string().optional(),
  container: z.string().min(1, "Obrigatório"),
  armador: z.string().min(1, "Obrigatório"),
  tara: z.number().min(0).optional().default(0),
  mgw: z.number().min(0).optional().default(0),
  tipo: z.enum(TIPO_OPTIONS as [string, ...string[]]).optional(),
  padrao: z.enum(PADRAO_OPTIONS as [string, ...string[]]).optional(),
  statusVazioCheio: z.enum(STATUS_VAZIO_CHEIO_OPTIONS as [string, ...string[]]).optional(),
  
  // Seção 2: Prazos e Clientes
  dataPorto: z.string().optional(),
  freeTimeArmador: z.number().min(0).optional().default(0),
  demurrage: z.string().optional(),
  prazoDias: z.number().min(0).optional().default(0),
  clienteEntrada: z.string().optional(),
  transportadora: z.string().optional(),
  
  // Seção 3: Saída e Minuta
  estoque: z.enum(ESTOQUE_OPTIONS as [string, ...string[]]).optional(),
  transportadoraSaida: z.string().optional(),
  statusEntregaMinuta: z.enum(STATUS_ENTREGA_MINUTA_OPTIONS as [string, ...string[]]).optional(),
  statusMinuta: z.enum(STATUS_MINUTA_OPTIONS as [string, ...string[]]).optional(),
  bookingAtrelado: z.string().optional(),
  lacre: z.string().optional(),
  clienteSaidaDestino: z.string().optional(),
  atrelado: z.string().optional(),
  operadorSaida: z.string().optional(),
  dataEstufagem: z.string().optional(),
  
  // Seção 4: Baixa SJP e Status Geral
  dataSaidaSJP: z.string().optional(),
  motoristaSaidaSJP: z.string().optional(),
  placaSaida: z.string().optional(),
  depotDevolucao: z.string().optional(),
  status: z.enum(STATUS_GERAL_OPTIONS as [string, ...string[]]).optional(),
  
  // Campos de cálculo/metadata (não editáveis diretamente no formulário)
  diasRestantes: z.number().optional().default(0),
  id: z.string().optional(),
  files: z.any().optional(),
});

type ContainerFormData = z.infer<typeof ContainerSchema>;

interface ContainerFormDialogProps {
  container?: Container;
  onSave: (container: Partial<Container>) => void;
  trigger?: React.ReactNode;
}

// Função auxiliar para garantir que o valor seja um dos valores válidos do enum ou vazio
const getValidSelectValue = (value: string | number | undefined, options: readonly string[]): string => {
    const strValue = String(value || '');
    if (options.includes(strValue)) {
        return strValue;
    }
    return ''; // Retorna string vazia se não for válido
};

export function ContainerFormDialog({ container, onSave, trigger }: ContainerFormDialogProps) {
  const [open, setOpen] = useState(false);
  
  const defaultValues: ContainerFormData = {
    operador: "", motoristaEntrada: "", placa: "", dataEntrada: "", container: "", armador: "",
    tara: 0, mgw: 0, tipo: "", padrao: "", statusVazioCheio: "", dataPorto: "", freeTimeArmador: 0,
    demurrage: "", prazoDias: 0, clienteEntrada: "", transportadora: "", estoque: "",
    transportadoraSaida: "", statusEntregaMinuta: "", statusMinuta: "", bookingAtrelado: "",
    lacre: "", clienteSaidaDestino: "", atrelado: "", operadorSaida: "", dataEstufagem: "",
    dataSaidaSJP: "", motoristaSaidaSJP: "", placaSaida: "", depotDevolucao: "", diasRestantes: 0, status: "",
  };

  const form = useForm<ContainerFormData>({
    resolver: zodResolver(ContainerSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (container) {
      // Mapeamento de volta para o formulário, garantindo que Selects tenham valores válidos
      form.reset({
        ...container,
        tara: Number(container.tara) || 0,
        mgw: Number(container.mgw) || 0,
        freeTimeArmador: Number(container.freeTimeArmador) || 0,
        prazoDias: Number(container.prazoDias) || 0,
        diasRestantes: Number(container.diasRestantes) || 0, // FIX: Garantir que diasRestantes seja number
        tipo: getValidSelectValue(container.tipo, TIPO_OPTIONS),
        padrao: getValidSelectValue(container.padrao, PADRAO_OPTIONS),
        statusVazioCheio: getValidSelectValue(container.statusVazioCheio, STATUS_VAZIO_CHEIO_OPTIONS),
        estoque: getValidSelectValue(container.estoque, ESTOQUE_OPTIONS),
        statusEntregaMinuta: getValidSelectValue(container.statusEntregaMinuta, STATUS_ENTREGA_MINUTA_OPTIONS),
        statusMinuta: getValidSelectValue(container.statusMinuta, STATUS_MINUTA_OPTIONS),
        status: getValidSelectValue(container.status, STATUS_GERAL_OPTIONS),
      });
    } else {
      form.reset(defaultValues);
    }
  }, [container, open, form]);

  const onSubmit = (data: ContainerFormData) => {
    // Garante que diasRestantes seja atualizado com prazoDias
    const dataToSave: Partial<Container> = {
        ...data,
        diasRestantes: data.prazoDias,
    };
    
    onSave(dataToSave);
    setOpen(false);
  };
  
  // Componente auxiliar para renderizar campos de input
  const InputField = ({ name, label, type = "text", placeholder, required = false }: { name: keyof ContainerFormData, label: string, type?: string, placeholder?: string, required?: boolean }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel className={cn("text-xs", required && "font-bold")}>{label} {required && "*"}</FormLabel>
          <FormControl>
            <Input 
              {...field} 
              type={type}
              placeholder={placeholder}
              className="h-8 text-sm"
              value={field.value === 0 && type === 'number' ? 0 : field.value || ''}
              onChange={(e) => {
                if (type === 'number') {
                  field.onChange(parseFloat(e.target.value) || 0);
                } else {
                  field.onChange(e.target.value);
                }
              }}
            />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
  
  // Componente auxiliar para renderizar campos de Select
  const SelectField = ({ name, label, options }: { name: keyof ContainerFormData, label: string, options: readonly string[] }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel className="text-xs">{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value || ''}>
            <FormControl>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={`Selecione o ${label.toLowerCase()}`} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Container
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0"> {/* Aumentando o tamanho máximo */}
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-xl">{container ? "Editar Container" : "Novo Container"}</DialogTitle>
          <DialogDescription className="text-sm">
            {container ? "Edite os dados do container" : "Preencha os dados do novo container"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <ScrollArea className="flex-1 max-h-[80vh] p-4 pt-2">
              <div className="space-y-6">
                
                {/* Seção 1: Entrada e Identificação */}
                <Card className="compact-card">
                  <CardHeader className="p-3 pb-2 flex flex-row items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">1. Entrada e Identificação</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      
                      <InputField name="container" label="CONTAINER" required />
                      <InputField name="armador" label="ARMADOR" required />
                      <InputField name="dataEntrada" label="DATA ENTRADA" placeholder="DD/MM/AAAA" />
                      <InputField name="operador" label="OPERADOR1" />
                      
                      <InputField name="motoristaEntrada" label="MOTORISTA ENTRADA" />
                      <InputField name="placa" label="PLACA1" />
                      <InputField name="tara" label="TARA (kg)" type="number" />
                      <InputField name="mgw" label="MGW (kg)" type="number" />
                      
                      <SelectField name="tipo" label="TIPO" options={TIPO_OPTIONS} />
                      <SelectField name="padrao" label="PADRÃO" options={PADRAO_OPTIONS} />
                      <SelectField name="statusVazioCheio" label="STATUS (VAZIO/CHEIO)" options={STATUS_VAZIO_CHEIO_OPTIONS} />
                    </div>
                  </CardContent>
                </Card>

                {/* Seção 2: Prazos e Clientes */}
                <Card className="compact-card">
                  <CardHeader className="p-3 pb-2 flex flex-row items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">2. Prazos e Clientes</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      
                      <InputField name="dataPorto" label="DATA PORTO" placeholder="DD/MM/AAAA" />
                      <InputField name="freeTimeArmador" label="FREE TIME ARMADOR (dias)" type="number" />
                      <InputField name="prazoDias" label="PRAZO (DIAS)" type="number" />
                      <InputField name="demurrage" label="DEMURRAGE" />
                      
                      <InputField name="clienteEntrada" label="CLIENTE DE ENTRADA" />
                      <InputField name="transportadora" label="TRANSPORTADORA (Entrada)" />
                      <SelectField name="estoque" label="ESTOQUE" options={ESTOQUE_OPTIONS} />
                    </div>
                  </CardContent>
                </Card>

                {/* Seção 3: Saída e Minuta */}
                <Card className="compact-card">
                  <CardHeader className="p-3 pb-2 flex flex-row items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">3. Saída e Minuta</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      
                      <InputField name="transportadoraSaida" label="TRANSPORTADORA (Saída)" />
                      <SelectField name="statusEntregaMinuta" label="STATUS ENTREGA MINUTA" options={STATUS_ENTREGA_MINUTA_OPTIONS} />
                      <SelectField name="statusMinuta" label="STATUS MINUTA" options={STATUS_MINUTA_OPTIONS} />
                      <InputField name="bookingAtrelado" label="BOOKING ATRELADO" />
                      
                      <InputField name="lacre" label="LACRE" />
                      <InputField name="clienteSaidaDestino" label="CLIENTE SAIDA / DESTINO" />
                      <InputField name="atrelado" label="ATRELADO" />
                      <InputField name="operadorSaida" label="OPERADOR (Saída)" />
                      
                      <InputField name="dataEstufagem" label="DATA DA ESTUFAGEM" placeholder="DD/MM/AAAA" />
                    </div>
                  </CardContent>
                </Card>

                {/* Seção 4: Baixa SJP e Status Geral */}
                <Card className="compact-card">
                  <CardHeader className="p-3 pb-2 flex flex-row items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">4. Baixa SJP e Status Geral</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      
                      <InputField name="dataSaidaSJP" label="DATA SAIDA SJP" placeholder="DD/MM/AAAA" />
                      <InputField name="motoristaSaidaSJP" label="MOTORISTA SAIDA SJP" />
                      <InputField name="placaSaida" label="PLACA (Saída)" />
                      <InputField name="depotDevolucao" label="DEPOT DE DEVOLUÇÃO" />
                      
                      <SelectField name="status" label="STATUS GERAL" options={STATUS_GERAL_OPTIONS} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            <DialogFooter className="p-4 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}