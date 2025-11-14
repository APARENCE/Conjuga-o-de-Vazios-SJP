import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/index.css'; // Caminho corrigido
import { Button } from '@/components/ui/button';
import { Crop as CropIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

// Proporção 4:1 é ideal para focar na linha do número.
const ASPECT_RATIO = 4 / 1; 

// Função para centralizar o corte inicial
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80, // Reduzindo a largura inicial para 80%
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

// Função para converter o corte em pixels para uma URL de imagem
function getCroppedImage(image: HTMLImageElement, crop: PixelCrop): Promise<string> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return Promise.reject(new Error('No 2d context'));
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, 'image/jpeg', 0.95);
  });
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [loading, setLoading] = useState(false);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    
    // 1. Define o corte inicial (80% da largura, proporção 4:1)
    const initialCrop = centerAspectCrop(width, height, ASPECT_RATIO);
    
    // 2. Ajusta a posição vertical para o topo (10% do topo)
    initialCrop.y = 10; 
    
    setCrop(initialCrop);
    // Usamos 'as any as PixelCrop' para forçar a tipagem, pois o ReactCrop garante que o objeto é válido para PixelCrop após a inicialização.
    setCompletedCrop(initialCrop as any as PixelCrop); 
  }

  const handleCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    setLoading(true);
    
    try {
      const croppedImageUrl = await getCroppedImage(imgRef.current, completedCrop);
      onCropComplete(croppedImageUrl);
    } catch (error) {
      console.error("Erro ao cortar imagem:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative flex justify-center bg-muted/50 rounded-lg overflow-hidden">
        <ReactCrop
          crop={crop}
          onChange={c => setCrop(c)}
          onComplete={c => setCompletedCrop(c)}
          aspect={ASPECT_RATIO}
          minWidth={100}
          minHeight={20}
          ruleOfThirds={false}
          className="w-full"
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={imageSrc}
            onLoad={onImageLoad}
            className="w-full h-auto max-h-[60vh] object-contain"
          />
        </ReactCrop>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onCancel} 
          className="flex-1 gap-2"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleCrop} 
          disabled={!completedCrop || loading}
          className="flex-1 gap-2"
        >
          {loading ? (
            <>
              <CropIcon className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Confirmar Corte e Processar OCR
            </>
          )}
        </Button>
      </div>
    </div>
  );
}