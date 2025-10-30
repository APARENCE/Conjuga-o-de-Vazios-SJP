import React, { useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PortariaCameraProps {
  onCapture: (imageSrc: string) => void;
}

export function PortariaCamera({ onCapture }: PortariaCameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const image = webcamRef.current.getScreenshot();
      if (image) {
        setImageSrc(image);
      } else {
        // Adiciona um toast de erro se a captura falhar
        console.error("Falha ao capturar a imagem. Verifique as permissões da câmera.");
      }
    }
  }, [webcamRef]);

  const handleConfirm = () => {
    if (imageSrc) {
      onCapture(imageSrc);
    }
  };

  const handleRetake = () => {
    setImageSrc(null);
    setIsCameraReady(false); // Força a re-inicialização se necessário
  };
  
  // Função chamada quando a câmera está pronta
  const handleUserMedia = () => {
    setIsCameraReady(true);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        {imageSrc ? (
          <div className="relative">
            <img src={imageSrc} alt="Captured Container" className="w-full h-auto rounded-lg" />
            <div className="flex justify-center gap-4 mt-4">
              <Button onClick={handleConfirm} className="bg-success hover:bg-success/90 gap-2">
                <Check className="h-4 w-4" /> Confirmar
              </Button>
              <Button variant="outline" onClick={handleRetake} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Refazer
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: "environment", // Tenta usar a câmera traseira
              }}
              onUserMedia={handleUserMedia} // Adiciona o handler para saber quando está pronto
              className="w-full h-auto rounded-lg"
              // Estilos para garantir que o vídeo ocupe o espaço
              style={{ minHeight: '200px', objectFit: 'cover' }}
            />
            
            {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-lg">
                    Aguardando permissão da câmera...
                </div>
            )}

            <div className="flex justify-center mt-4">
              <Button onClick={capture} disabled={!isCameraReady} className="gap-2">
                <Camera className="h-4 w-4" /> Capturar Foto
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}