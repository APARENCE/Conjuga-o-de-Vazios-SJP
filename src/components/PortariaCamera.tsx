import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Image as ImageIcon, Crop as CropIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ImageCropper } from "./ImageCropper"; // Importando o novo componente
import { cn } from "@/lib/utils";

interface PortariaCameraProps {
  onCapture: (imageSrc: string) => void;
}

export function PortariaCamera({ onCapture }: PortariaCameraProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [croppedImageSrc, setCroppedImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const { toast } = useToast();

  const handleRetake = () => {
    setOriginalImageSrc(null);
    setCroppedImageSrc(null);
    setIsCropping(false);
  };
  
  const handleDownload = () => {
    const src = croppedImageSrc || originalImageSrc;
    if (src) {
      const link = document.createElement('a');
      link.href = src;
      link.download = `container_capture_${new Date().toISOString().split('T')[0]}.jpeg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Handler para upload de arquivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({
            title: "Tipo de arquivo inválido",
            description: "Por favor, selecione um arquivo de imagem.",
            variant: "destructive",
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOriginalImageSrc(result);
      setCroppedImageSrc(null); // Limpa o corte anterior
      setIsCropping(true); // Inicia o modo de corte
    };
    reader.readAsDataURL(file);
    
    event.target.value = '';
  };
  
  const handleCropComplete = (croppedImageUrl: string) => {
    setCroppedImageSrc(croppedImageUrl);
    setIsCropping(false);
    onCapture(croppedImageUrl); // Aciona o OCR com a imagem CORTADA
  };

  // Se estiver no modo de corte, renderiza o Cropper
  if (isCropping && originalImageSrc) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-2">Ajuste a Área de Leitura (1:4)</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Posicione o número do container dentro do quadrado vermelho para garantir a leitura correta.
          </p>
          <ImageCropper
            imageSrc={originalImageSrc}
            onCropComplete={handleCropComplete}
            onCancel={handleRetake}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        {croppedImageSrc ? (
          <div className="relative">
            <img src={croppedImageSrc} alt="Container Cortado" className="w-full h-auto rounded-lg border-2 border-success" />
            
            <div className="flex justify-center gap-4 mt-4">
              <Button onClick={handleDownload} variant="secondary" className="gap-2 flex-1">
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="outline" onClick={() => setIsCropping(true)} className="gap-2 flex-1">
                <CropIcon className="h-4 w-4" /> Ajustar Corte
              </Button>
            </div>
            <Button variant="outline" onClick={handleRetake} className="gap-2 w-full mt-2">
                <Upload className="h-4 w-4" /> Novo Upload
            </Button>
          </div>
        ) : (
          <div className="relative p-10 border-2 border-dashed border-muted-foreground/50 rounded-lg flex flex-col items-center justify-center space-y-4 min-h-[200px]">
            {/* Input de arquivo oculto */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <ImageIcon className="h-12 w-12 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground text-center">
                Clique abaixo para carregar a foto do container.
            </p>
            <p className="text-xs text-danger font-semibold text-center">
                Ajuste o corte para focar apenas no número do container.
            </p>

            <Button 
              onClick={() => fileInputRef.current?.click()} 
              className="gap-2 w-full max-w-xs"
            >
              <Upload className="h-4 w-4" /> Carregar Foto
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}