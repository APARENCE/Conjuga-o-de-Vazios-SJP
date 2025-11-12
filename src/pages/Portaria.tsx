import { useState, useMemo, useEffect } from "react";
import { Container } from "@/types/container";
import { PortariaCamera } from "@/components/PortariaCamera";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Truck, LogIn, LogOut, AlertTriangle, CheckCircle2, Search, User, Car, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useOcrProcessor } from "@/hooks/use-ocr-processor"; // Importando o novo hook
import { cn } from "@/lib/utils";

interface PortariaPageProps {
  containers: Container[];
  onContainerUpdate: (id: string, data: Partial<Container>) => void;
  onContainerAdd: (data: Partial<Container>) => void; // Adicionando handler para novos containers
}

export default function Portaria({ containers, onContainerUpdate, onContainerAdd }: PortariaPageProps) {
  const [containerNumber, setContainerNumber] = useState("");
  const [placa, setPlaca] = useState("");
  const [motorista, setMotorista] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'entrada' | 'baixa'>('entrada');
  const { toast } = useToast();
  
  // Inicializa o processador OCR
  const { container: ocrContainer, plate: ocrPlate, isProcessing, processImage } = useOcrProcessor();

  const searchNumber = containerNumber.toUpperCase().trim();
  
  // Busca o container existente
  const existingContainer = useMemo(() => {
    if (!searchNumber) return null;
    return containers.find(c => String(c.container || '').toUpperCase().trim() === searchNumber);
  }, [containers, searchNumber]);

  // Efeito para preencher os campos após o OCR
  useEffect(() => {
    if (!isProcessing && ocrContainer) {
      setContainerNumber(ocrContainer);
      toast({
        title: "OCR Concluído",
        description: `Container (${ocrContainer}) reconhecido.`,
      });
    }
    if (!isProcessing && ocrPlate) {
      setPlaca(ocrPlate);
      if (!ocrContainer) { // Se só reconheceu a placa, avisa
        toast({
            title: "OCR Concluído",
            description: `Placa (${ocrPlate}) reconhecida.`,
        });
      }
    }
    if (!isProcessing && capturedImage && !ocrContainer && !ocrPlate) {
        toast({
            title: "OCR Concluído",
            description: "Nenhum container ou placa reconhecido. Por favor, insira manualmente.",
            variant: "warning",
        });
    }
  }, [isProcessing, ocrContainer, ocrPlate, capturedImage, toast]);


  const handleCapture = async (imageSrc: string) => {
    setCapturedImage(imageSrc);
    toast({
      title: "Foto Capturada",
      description: "Iniciando reconhecimento OCR...",
    });
    
    // Inicia o processamento OCR
    await processImage(imageSrc);
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
    
    if (actionType === 'entrada' && (!placa || !motorista)) {
        toast({ title: "Erro", description: "Placa e Motorista são obrigatórios para a Entrada.", variant: "destructive" });
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
        dataEntrada: dateOnly, // Usando o novo campo
        placa: placa.toUpperCase().trim(), // Salvando a placa
        motoristaEntrada: motorista.trim(), // Salvando o motorista
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
            // Definindo defaults para os novos campos obrigatórios
            operador: "", tara: 0, mgw: 0, tipo: "", padrao: "", statusVazioCheio: "", dataPorto: "", freeTimeArmador: 0,
            demurrage: "", prazoDias: 0, clienteEntrada: "", transportadora: "", estoque: "", transportadoraSaida: "", statusEntregaMinuta: "", statusMinuta: "", bookingAtrelado: "",
            lacre: "", clienteSaidaDestino: "", atrelado: "", operadorSaida: "", dataEstufagem: "", dataSaidaSJP: "", motoristaSaidaSJP: "", placaSaida: "",
            diasRestantes: 0, // Mapeado de prazoDias
            files: [newFile],
        });
        toastMessage = `Novo container ${searchNumber} registrado com sucesso.`;
      }

    } else { // 'baixa' (Saída SJP)
      if (!existingContainer) {
        toast({ title: "Erro", description: `Container ${searchNumber} não encontrado para baixa.`, variant: "destructive" });
        return;
      }
      
      updateData = {
        dataSaidaSJP: dateOnly, // Usando o novo campo de saída
        placaSaida: placa.toUpperCase().trim(), // Usando a placa de saída
        motoristaSaidaSJP: motorista.trim(), // Usando o motorista de saída
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
    setPlaca("");
    setMotorista("");
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

  const isActionDisabled = !searchNumber || !capturedImage || isProcessing || (actionType === 'baixa' && !existingContainer);

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" /> Controle de Gate
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registro rápido de entrada e baixa de containers com captura de imagem.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Coluna 1: Câmera e Captura */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">1. Captura de Imagem</h2>
          <PortariaCamera onCapture={handleCapture} />
        </div>

        {/* Coluna 2: Ação e Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">2. Detalhes e Ação</h2>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Dados da Operação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Container Number */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número do Container (Ex: ABCU1234567)"
                  value={containerNumber}
                  onChange={(e) => setContainerNumber(e.target.value)}
                  className={cn("pl-10 text-sm font-mono uppercase h-9", isProcessing && "opacity-50")}
                  disabled={isProcessing}
                />
              </div>
              
              {/* Placa e Motorista (Apenas para Entrada/Baixa) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Placa"
                      value={placa}
                      onChange={(e) => setPlaca(e.target.value)}
                      className={cn("pl-10 text-sm uppercase h-9", isProcessing && "opacity-50")}
                      disabled={isProcessing}
                    />
                </div>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Motorista"
                      value={motorista}
                      onChange={(e) => setMotorista(e.target.value)}
                      className={cn("pl-10 text-sm h-9", isProcessing && "opacity-50")}
                      disabled={isProcessing}
                    />
                </div>
              </div>

              {existingContainer && (
                <div className="border p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                  <p className="font-medium">Container Encontrado:</p>
                  <p className="text-xs">Armador: <span className="font-semibold">{existingContainer.armador || 'N/A'}</span></p>
                  <p className="text-xs">Status Atual: {getStatusBadge(existingContainer.status)}</p>
                  <p className="text-xs">Prazo (Dias): <span className="font-semibold">{existingContainer.prazoDias}</span></p>
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
                <p className="font-medium text-sm">Ação a ser registrada:</p>
                <div className="flex gap-2">
                  <Button 
                    variant={actionType === 'entrada' ? 'default' : 'outline'}
                    onClick={() => setActionType('entrada')}
                    className="flex-1 gap-2 h-9 text-sm"
                    disabled={isProcessing}
                  >
                    <LogIn className="h-4 w-4" /> Entrada
                  </Button>
                  <Button 
                    variant={actionType === 'baixa' ? 'destructive' : 'outline'}
                    onClick={() => setActionType('baixa')}
                    className="flex-1 gap-2 h-9 text-sm"
                    disabled={isProcessing}
                  >
                    <LogOut className="h-4 w-4" /> Baixa (Saída SJP)
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleAction}
                disabled={isActionDisabled}
                className="w-full h-10 text-md gap-2"
              >
                {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : actionType === 'entrada' ? (
                    <LogIn className="h-5 w-5" />
                ) : (
                    <LogOut className="h-5 w-5" />
                )}
                {isProcessing ? 'Processando OCR...' : `Registrar ${actionType === 'entrada' ? 'Entrada' : 'Baixa'}`}
              </Button>
              
              {capturedImage && !isProcessing && (
                <div className="text-sm text-success flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Foto capturada e OCR concluído.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}