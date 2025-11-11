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
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContainerFormDialogProps {
  container?: Container;
  onSave: (container: Partial<Container>) => void;
  trigger?: React.ReactNode;
}

// Estrutura de dados inicial (com todos os novos campos)
const initialFormData: Partial<Container> = {
  operador: "",
  motoristaEntrada: "",
  placa: "",
  dataEntrada: "",
  container: "",
  armador: "",
  tara: 0,
  mgw: 0,
  tipo: "",
  padrao: "",
  statusVazioCheio: "",
  dataPorto: "",
  freeTimeArmador: 0,
  demurrage: "",
  prazoDias: 0,
  clienteEntrada: "",
  transportadora: "",
  estoque: "",
  transportadoraSaida: "",
  statusEntregaMinuta: "",
  statusMinuta: "",
  bookingAtrelado: "",
  lacre: "",
  clienteSaidaDestino: "",
  atrelado: "",
  operadorSaida: "",
  dataEstufagem: "",
  dataSaidaSJP: "",
  motoristaSaidaSJP: "",
  placaSaida: "",
  diasRestantes: 0,
  status: "",
};

export function ContainerFormDialog({ container, onSave, trigger }: ContainerFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Container>>(initialFormData);

  useEffect(() => {
    if (container) {
      setFormData(container);
    } else {
      setFormData(initialFormData);
    }
  }, [container, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Garante que diasRestantes seja atualizado com prazoDias
    const dataToSave = {
        ...formData,
        diasRestantes: formData.prazoDias,
    };
    
    onSave(dataToSave);
    setOpen(false);
  };

  const handleChange = (field: keyof Container, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{container ? "Editar Container" : "Novo Container"}</DialogTitle>
          <DialogDescription>
            {container ? "Edite os dados do container" : "Preencha os dados do novo container"}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Seção 1: Entrada e Identificação (11 campos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 border-b pb-4">
              <h3 className="col-span-full text-sm font-semibold text-muted-foreground">1. Entrada e Identificação</h3>
              
              {/* Linha 1: CONTAINER, OPERADOR1, MOTORISTA ENTRADA, PLACA1, DATA ENTRADA, ARMADOR */}
              <div className="space-y-2">
                <Label htmlFor="container">CONTAINER *</Label>
                <Input id="container" value={formData.container} onChange={(e) => handleChange("container", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operador">OPERADOR1</Label>
                <Input id="operador" value={formData.operador} onChange={(e) => handleChange("operador", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motoristaEntrada">MOTORISTA ENTRADA</Label>
                <Input id="motoristaEntrada" value={formData.motoristaEntrada} onChange={(e) => handleChange("motoristaEntrada", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placa">PLACA1</Label>
                <Input id="placa" value={formData.placa} onChange={(e) => handleChange("placa", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataEntrada">DATA ENTRADA</Label>
                <Input id="dataEntrada" value={formData.dataEntrada} onChange={(e) => handleChange("dataEntrada", e.target.value)} placeholder="DD/MM/AAAA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="armador">ARMADOR *</Label>
                <Input id="armador" value={formData.armador} onChange={(e) => handleChange("armador", e.target.value)} required />
              </div>
              
              {/* Linha 2: TARA, MGW, TIPO, PADRÃO, STATUS (V/C) */}
              <div className="space-y-2">
                <Label htmlFor="tara">TARA (kg)</Label>
                <Input id="tara" type="number" value={formData.tara} onChange={(e) => handleChange("tara", parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mgw">MGW (kg)</Label>
                <Input id="mgw" type="number" value={formData.mgw} onChange={(e) => handleChange("mgw", parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">TIPO</Label>
                <Input id="tipo" value={formData.tipo} onChange={(e) => handleChange("tipo", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="padrao">PADRÃO</Label>
                <Input id="padrao" value={formData.padrao} onChange={(e) => handleChange("padrao", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statusVazioCheio">STATUS (VAZIO/CHEIO)</Label>
                <Input id="statusVazioCheio" value={formData.statusVazioCheio} onChange={(e) => handleChange("statusVazioCheio", e.target.value)} />
              </div>
            </div>

            {/* Seção 2: Prazos e Clientes (6 campos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 border-b pb-4">
              <h3 className="col-span-full text-sm font-semibold text-muted-foreground">2. Prazos e Clientes</h3>
              
              {/* DATA PORTO, FREETimearmador, Demurrage, Prazo(dias), CLIENTE DE ENTRADA, TRANSPORTADORA (Entrada) */}
              <div className="space-y-2">
                <Label htmlFor="dataPorto">DATA PORTO</Label>
                <Input id="dataPorto" value={formData.dataPorto} onChange={(e) => handleChange("dataPorto", e.target.value)} placeholder="DD/MM/AAAA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freeTimeArmador">FREE TIME ARMADOR (dias)</Label>
                <Input id="freeTimeArmador" type="number" value={formData.freeTimeArmador} onChange={(e) => handleChange("freeTimeArmador", parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demurrage">DEMURRAGE</Label>
                <Input id="demurrage" value={formData.demurrage} onChange={(e) => handleChange("demurrage", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prazoDias">PRAZO (DIAS)</Label>
                <Input id="prazoDias" type="number" value={formData.prazoDias} onChange={(e) => handleChange("prazoDias", parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clienteEntrada">CLIENTE DE ENTRADA</Label>
                <Input id="clienteEntrada" value={formData.clienteEntrada} onChange={(e) => handleChange("clienteEntrada", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transportadora">TRANSPORTADORA (Entrada)</Label>
                <Input id="transportadora" value={formData.transportadora} onChange={(e) => handleChange("transportadora", e.target.value)} />
              </div>
            </div>

            {/* Seção 3: Saída e Minuta (10 campos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 border-b pb-4">
              <h3 className="col-span-full text-sm font-semibold text-muted-foreground">3. Saída e Minuta</h3>
              
              {/* ESTOQUE, TRANSPORTADORA (Saída), STATUS ENTREGA MINUTA, STATUS MINUTA, BOOKING ATRELADO, LACRE */}
              <div className="space-y-2">
                <Label htmlFor="estoque">ESTOQUE</Label>
                <Input id="estoque" value={formData.estoque} onChange={(e) => handleChange("estoque", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transportadoraSaida">TRANSPORTADORA (Saída)</Label>
                <Input id="transportadoraSaida" value={formData.transportadoraSaida} onChange={(e) => handleChange("transportadoraSaida", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statusEntregaMinuta">STATUS ENTREGA MINUTA</Label>
                <Input id="statusEntregaMinuta" value={formData.statusEntregaMinuta} onChange={(e) => handleChange("statusEntregaMinuta", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statusMinuta">STATUS MINUTA</Label>
                <Input id="statusMinuta" value={formData.statusMinuta} onChange={(e) => handleChange("statusMinuta", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookingAtrelado">BOOKING ATRELADO</Label>
                <Input id="bookingAtrelado" value={formData.bookingAtrelado} onChange={(e) => handleChange("bookingAtrelado", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lacre">LACRE</Label>
                <Input id="lacre" value={formData.lacre} onChange={(e) => handleChange("lacre", e.target.value)} />
              </div>
              
              {/* CLIENTE SAIDA / DESTINO, ATRELADO, OPERADOR (Saída), DATA DA ESTUFAGEM */}
              <div className="space-y-2">
                <Label htmlFor="clienteSaidaDestino">CLIENTE SAIDA / DESTINO</Label>
                <Input id="clienteSaidaDestino" value={formData.clienteSaidaDestino} onChange={(e) => handleChange("clienteSaidaDestino", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="atrelado">ATRELADO</Label>
                <Input id="atrelado" value={formData.atrelado} onChange={(e) => handleChange("atrelado", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operadorSaida">OPERADOR (Saída)</Label>
                <Input id="operadorSaida" value={formData.operadorSaida} onChange={(e) => handleChange("operadorSaida", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataEstufagem">DATA DA ESTUFAGEM</Label>
                <Input id="dataEstufagem" value={formData.dataEstufagem} onChange={(e) => handleChange("dataEstufagem", e.target.value)} placeholder="DD/MM/AAAA" />
              </div>
            </div>

            {/* Seção 4: Saída SJP e Status Geral (4 campos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <h3 className="col-span-full text-sm font-semibold text-muted-foreground">4. Saída SJP e Status Geral</h3>
              
              {/* DATA SAIDA SJP, MOTORISTA SAIDA SJP, PLACA SAIDA, STATUS GERAL */}
              <div className="space-y-2">
                <Label htmlFor="dataSaidaSJP">DATA SAIDA SJP</Label>
                <Input id="dataSaidaSJP" value={formData.dataSaidaSJP} onChange={(e) => handleChange("dataSaidaSJP", e.target.value)} placeholder="DD/MM/AAAA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motoristaSaidaSJP">MOTORISTA SAIDA SJP</Label>
                <Input id="motoristaSaidaSJP" value={formData.motoristaSaidaSJP} onChange={(e) => handleChange("motoristaSaidaSJP", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placaSaida">PLACA (Saída)</Label>
                <Input id="placaSaida" value={formData.placaSaida} onChange={(e) => handleChange("placaSaida", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">STATUS GERAL</Label>
                <Input id="status" value={formData.status} onChange={(e) => handleChange("status", e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}