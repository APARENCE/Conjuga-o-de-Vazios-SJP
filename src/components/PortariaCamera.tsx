import React, { useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Upload, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface PortariaCameraProps {
  onCapture: (imageSrc: string) => void;
}

export function PortariaCamera({ onCapture }: PortariaCameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const { toast } = useToast();

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const image = webcamRef.current.getScreenshot();
      if (image) {
        setImageSrc(image);
        onCapture(image); // Chama o onCapture imediatamente após a foto
      } else {
        toast({
          title: "Erro na Câmera",
          description: "Falha ao capturar a imagem. Verifique as permissões.",
          variant: "destructive",
        });
      }
    }
  }, [webcamRef, onCapture, toast]);

  const handleRetake = () => {
    setImageSrc(null);
    setIsCameraReady(false); // Força a re-inicialização se necessário
  };
  
  const handleDownload = () => {
    if (imageSrc) {
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = `container_capture_${new Date().toISOString().split('T')[0]}.jpeg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const handleUserMedia = () => {
    setIsCameraReady(true);
  };

  // Novo handler para upload de arquivo
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
      setImageSrc(result);
      onCapture(result); // Aciona o OCR com a imagem carregada
    };
    reader.readAsDataURL(file);
    
    // Limpa o input para permitir o upload do mesmo arquivo novamente
    event.target.value = '';
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        {imageSrc ? (
          <div className="relative">
            <img src={imageSrc} alt="Captured Container" className="w-full h-auto rounded-lg" />
            <div className="flex justify-center gap-4 mt-4">
              <Button onClick={handleDownload} variant="secondary" className="gap-2">
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="outline" onClick={handleRetake} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Refazer
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Input de arquivo oculto */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {/* Webcam para captura ao vivo */}
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: "environment", // Tenta usar a câmera traseira
              }}
              onUserMedia={handleUserMedia}
              className="w-full h-auto rounded-lg"
              style={{ minHeight: '200px', objectFit: 'cover' }}
            />
            
            {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-lg">
                    Aguardando permissão da câmera...
                </div>
            )}

            <div className="flex justify-center gap-4 mt-4">
              <Button onClick={capture} disabled={!isCameraReady} className="gap-2 flex-1">
                <Camera className="h-4 w-4" /> Capturar Foto
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => fileInputRef.current?.click()} 
                className="gap-2 flex-1"
              >
                <Upload className="h-4 w-4" /> Upload Foto
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}