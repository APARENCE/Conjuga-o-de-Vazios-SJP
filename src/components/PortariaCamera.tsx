import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface PortariaCameraProps {
  onCapture: (imageSrc: string) => void;
}

export function PortariaCamera({ onCapture }: PortariaCameraProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRetake = () => {
    setImageSrc(null);
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
            <img src={imageSrc} alt="Uploaded Container" className="w-full h-auto rounded-lg" />
            <div className="flex justify-center gap-4 mt-4">
              <Button onClick={handleDownload} variant="secondary" className="gap-2 flex-1">
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="outline" onClick={handleRetake} className="gap-2 flex-1">
                <Upload className="h-4 w-4" /> Novo Upload
              </Button>
            </div>
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
                Clique abaixo para carregar a foto do container e iniciar o OCR.
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