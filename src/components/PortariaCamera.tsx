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

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const image = webcamRef.current.getScreenshot();
      if (image) {
        setImageSrc(image);
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
                facingMode: "environment", // Tenta usar a câmera traseira em dispositivos móveis
              }}
              className="w-full h-auto rounded-lg"
            />
            <div className="flex justify-center mt-4">
              <Button onClick={capture} className="gap-2">
                <Camera className="h-4 w-4" /> Capturar Foto
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}