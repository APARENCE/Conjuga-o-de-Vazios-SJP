import { useState, useMemo } from "react";
import { Container } from "@/types/container";
import { PortariaCamera } from "@/components/PortariaCamera";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Truck, LogIn, LogOut, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface PortariaPageProps {
  containers: Container[];
  onContainerUpdate: (id: string, data: Partial<Container>) => void;
  onContainerAdd: (data: Partial<Container>) => void; // Adicionando handler para novos containers
}

export default function Portaria({ containers, onContainerUpdate, onContainerAdd }: PortariaPageProps) {
  const [containerNumber, setContainerNumber] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'entrada' | 'baixa'>('entrada');
  const { toast } = useToast();

  const searchNumber = containerNumber.toUpperCase().trim();
  
  // Busca o container existente
  const existingContainer = useMemo(() => {
    if (!searchNumber) return null;
    return containers.find(c => String(c.container || '').toUpperCase().trim() === searchNumber);
  }, [containers, searchNumber]);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    toast({
      title: "Foto Capturada",
      description: "Confirme o número do container e a ação.",
    });
  };

  const handleAction = () => {
    if (!searchNumber) {
      toast({ title: "Erro", description: "Insira o número do container.", variant: "destructive" });
      return;
    }
    if (!capturedImage) {
      toast({ title: "Erro", description: "Capture a foto do container. A foto é obrigatória.", variant: "destructive" });
      return;
    }

    const now = new Date().toLocaleString('pt-BR');
    const dateOnly = now.split(' ')[0];
    
    const newFile = {
        id: `photo-${Date.now()}`,
        name: `${actionType}_${searchNumber}_${dateOnly.replace(/\//g, '-')}.jpg`,
        type: 'image/jpeg',
        size: 0, 
        dataUrl: capturedImage,
        uploadedAt: new Date().toISOString(),
    };

    let updateData: Partial<Container> = {};
    let toastMessage = "";

    if (actionType === 'entrada') {
      updateData = {
        container: searchNumber,
        dataOperacao: dateOnly,
        status: "Em Operação (Entrada)",
      };
      toastMessage = `Entrada registrada para o container ${searchNumber}.`;
      
      if (existingContainer) {
        // Container existe: Atualiza dados e adiciona a foto
        const updatedFiles = [...(existingContainer.files || []), newFile];
        onContainerUpdate(existingContainer.id, { 
            ...updateData, 
            files: updatedFiles 
        });
      } else {
        // Container novo: Adiciona um novo container
        onContainerAdd({
            ...updateData,
            armador: "N/A", // Valor padrão para campos obrigatórios
            depotDevolucao: "N/A",
            dataDevolucao: "",
            freeTime: 0,
            diasRestantes: 0,
            placas: "",
            motorista: "",
            origem: "",
            demurrage: "",
            files: [newFile],
        });
        toastMessage = `Novo container ${searchNumber} registrado com sucesso.`;
      }

    } else { // 'baixa'
      if (!existingContainer) {
        toast({ title: "Erro", description: `Container ${searchNumber} não encontrado para baixa.`, variant: "destructive" });
        return;
      }
      
      updateData = {
        baixaPatio: dateOnly,
        status: "Baixa Pátio SJP",
      };
      toastMessage = `Baixa registrada para o container ${searchNumber}.`;
      
      // Container existe: Atualiza dados e adiciona a foto
      const updatedFiles = [...(existingContainer.files || []), newFile];
      onContainerUpdate(existingContainer.id, { 
          ...updateData, 
          files: updatedFiles 
      });
    }

    // Limpa o estado
    setContainerNumber("");
    setCapturedImage(null);
    
    toast({ title: "Sucesso", description: toastMessage, variant: "default" });
  };

  const getStatusBadge = (status: string) => {
    const statusLower = String(status).toLowerCase();
    if (statusLower.includes("ok") || statusLower.includes("devolvido")) {
      return <Badge className="bg-success text-white">Devolvido</Badge>;
    }
    if (statusLower.includes("aguardando") || statusLower.includes("verificar")) {
      return <Badge className="bg-warning text-white">Pendente</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const isActionDisabled = !searchNumber || !capturedImage || (actionType === 'baixa' && !existingContainer);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-7 w-7 text-primary" /> Controle de Portaria
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro rápido de entrada e baixa de containers com captura de imagem.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Coluna 1: Câmera e Captura */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">1. Captura de Imagem</h2>
          <PortariaCamera onCapture={handleCapture} />
        </div>

        {/* Coluna 2: Ação e Status */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">2. Detalhes e Ação</h2>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Número do Container</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ex: ABCU1234567"
                  value={containerNumber}
                  onChange={(e) => setContainerNumber(e.target.value)}
                  className="pl-10 text-lg font-mono uppercase"
                />
              </div>

              {existingContainer && (
                <div className="border p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="font-medium">Container Encontrado:</p>
                  <p className="text-sm">Armador: <span className="font-semibold">{existingContainer.armador || 'N/A'}</span></p>
                  <p className="text-sm">Status Atual: {getStatusBadge(existingContainer.status)}</p>
                  <p className="text-sm">Dias Restantes: <span className="font-semibold">{existingContainer.diasRestantes}</span></p>
                </div>
              )}
              
              {!existingContainer && searchNumber && actionType === 'entrada' && (
                <div className="text-primary text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Container não encontrado. Será criado como novo na entrada.
                </div>
              )}
              
              {!existingContainer && searchNumber && actionType === 'baixa' && (
                <div className="text-danger text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Container não encontrado. Não é possível registrar baixa.
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <p className="font-medium">Ação a ser registrada:</p>
                <div className="flex gap-2">
                  <Button 
                    variant={actionType === 'entrada' ? 'default' : 'outline'}
                    onClick={() => setActionType('entrada')}
                    className="flex-1 gap-2"
                  >
                    <LogIn className="h-4 w-4" /> Entrada
                  </Button>
                  <Button 
                    variant={actionType === 'baixa' ? 'destructive' : 'outline'}
                    onClick={() => setActionType('baixa')}
                    className="flex-1 gap-2"
                  >
                    <LogOut className="h-4 w-4" /> Baixa (Saída)
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleAction}
                disabled={isActionDisabled}
                className="w-full h-12 text-lg gap-2"
              >
                {actionType === 'entrada' ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
                Registrar {actionType === 'entrada' ? 'Entrada' : 'Baixa'}
              </Button>
              
              {capturedImage && (
                <div className="text-sm text-success flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Foto capturada e pronta para registro.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}