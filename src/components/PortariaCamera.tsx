import React, { useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, Download } from "lucide-react"; // Importando Download
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
        onCapture(image); // Chama o onCapture imediatamente após a foto
      } else {
        // Adiciona um toast de erro se a captura falhar
        console.error("Falha ao capturar a imagem. Verifique as permissões da câmera.");
      }
    }
  }, [webcamRef, onCapture]);

  const handleConfirm = () => {
    // A confirmação agora apenas limpa a imagem localmente, pois o OCR e o registro são feitos na Portaria.tsx
    // O onCapture já foi chamado no momento da captura.
    // Se você quiser que o onCapture seja chamado apenas na confirmação, precisaríamos mudar a lógica.
    // Mantendo a lógica atual: onCapture (e OCR) é feito na captura.
    // A confirmação é apenas para indicar que a foto está OK e o usuário pode prosseguir com a ação.
    // Para simplificar, vamos apenas permitir que o usuário prossiga para a ação principal na Portaria.tsx.
    // Não precisamos de um handler de confirmação aqui, pois a Portaria.tsx já tem a imagem.
  };

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