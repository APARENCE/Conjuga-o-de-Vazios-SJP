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

export function ContainerFormDialog({ container, onSave, trigger }: ContainerFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Container>>({
    container: "",
    armador: "",
    dataOperacao: "",
    dataPorto: "",
    demurrage: "",
    freeTime: 0,
    diasRestantes: 0,
    placas: "",
    motorista: "",
    origem: "",
    baixaPatio: "",
    containerTroca: "",
    armadorTroca: "",
    depotDevolucao: "",
    dataDevolucao: "",
    status: "",
  });

  useEffect(() => {
    if (container) {
      setFormData(container);
    }
  }, [container]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setOpen(false);
    if (!container) {
      setFormData({
        container: "",
        armador: "",
        dataOperacao: "",
        dataPorto: "",
        demurrage: "",
        freeTime: 0,
        diasRestantes: 0,
        placas: "",
        motorista: "",
        origem: "",
        baixaPatio: "",
        containerTroca: "",
        armadorTroca: "",
        depotDevolucao: "",
        dataDevolucao: "",
        status: "",
      });
    }
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
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{container ? "Editar Container" : "Novo Container"}</DialogTitle>
          <DialogDescription>
            {container ? "Edite os dados do container" : "Preencha os dados do novo container"}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Seção 1: Identificação e Status */}
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div className="space-y-2">
                <Label htmlFor="container">Container *</Label>
                <Input
                  id="container"
                  value={formData.container}
                  onChange={(e) => handleChange("container", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="armador">Armador *</Label>
                <Input
                  id="armador"
                  value={formData.armador}
                  onChange={(e) => handleChange("armador", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                />
              </div>
            </div>

            {/* Seção 2: Datas e Prazos */}
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <h3 className="col-span-2 text-sm font-semibold text-muted-foreground">Datas e Prazos</h3>
              <div className="space-y-2">
                <Label htmlFor="dataOperacao">Data de Operação</Label>
                <Input
                  id="dataOperacao"
                  value={formData.dataOperacao}
                  onChange={(e) => handleChange("dataOperacao", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataPorto">Data Porto</Label>
                <Input
                  id="dataPorto"
                  value={formData.dataPorto}
                  onChange={(e) => handleChange("dataPorto", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demurrage">Demurrage</Label>
                <Input
                  id="demurrage"
                  value={formData.demurrage}
                  onChange={(e) => handleChange("demurrage", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freeTime">Free Time (dias)</Label>
                <Input
                  id="freeTime"
                  type="number"
                  value={formData.freeTime}
                  onChange={(e) => handleChange("freeTime", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasRestantes">Dias Restantes</Label>
                <Input
                  id="diasRestantes"
                  type="number"
                  value={formData.diasRestantes}
                  onChange={(e) => handleChange("diasRestantes", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Seção 3: Logística e Motorista */}
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <h3 className="col-span-2 text-sm font-semibold text-muted-foreground">Logística</h3>
              <div className="space-y-2">
                <Label htmlFor="origem">Origem</Label>
                <Input
                  id="origem"
                  value={formData.origem}
                  onChange={(e) => handleChange("origem", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placas">Placas</Label>
                <Input
                  id="placas"
                  value={formData.placas}
                  onChange={(e) => handleChange("placas", e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="motorista">Motorista</Label>
                <Input
                  id="motorista"
                  value={formData.motorista}
                  onChange={(e) => handleChange("motorista", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depotDevolucao">Depot de Devolução</Label>
                <Input
                  id="depotDevolucao"
                  value={formData.depotDevolucao}
                  onChange={(e) => handleChange("depotDevolucao", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataDevolucao">Data de Devolução</Label>
                <Input
                  id="dataDevolucao"
                  value={formData.dataDevolucao}
                  onChange={(e) => handleChange("dataDevolucao", e.target.value)}
                />
              </div>
            </div>

            {/* Seção 4: Troca e Baixa */}
            <div className="grid grid-cols-2 gap-4">
              <h3 className="col-span-2 text-sm font-semibold text-muted-foreground">Troca e Baixa</h3>
              <div className="space-y-2">
                <Label htmlFor="baixaPatio">Baixa Pátio SJP</Label>
                <Input
                  id="baixaPatio"
                  value={formData.baixaPatio}
                  onChange={(e) => handleChange("baixaPatio", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="containerTroca">Container (Troca)</Label>
                <Input
                  id="containerTroca"
                  value={formData.containerTroca}
                  onChange={(e) => handleChange("containerTroca", e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="armadorTroca">Armador (Troca)</Label>
                <Input
                  id="armadorTroca"
                  value={formData.armadorTroca}
                  onChange={(e) => handleChange("armadorTroca", e.target.value)}
                />
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