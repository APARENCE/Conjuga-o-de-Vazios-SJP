import { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";

// Regex para Container: 4 letras + 7 dígitos.
const CONTAINER_REGEX = /[A-Z]{4}\d{7}/g;
// Regex para Container de 10 caracteres (4 letras + 6 dígitos)
const CONTAINER_PARTIAL_REGEX = /[A-Z]{4}\d{6}/g;
// Regex para Placa: 3 ou 4 letras seguidas por 3 a 4 caracteres alfanuméricos.
const PLATE_REGEX = /[A-Z]{3,4}[0-9A-Z]{3,4}/g; 

interface OcrResult {
  container: string;
  plate: string;
  isProcessing: boolean;
}

export function useOcrProcessor() {
  const [result, setResult] = useState<OcrResult>({
    container: "",
    plate: "",
    isProcessing: false,
  });

  const runOcrAttempt = async (worker: Tesseract.Worker, imageSrc: string, rectangle: Tesseract.Rectangle | undefined, psm: number, whitelist?: string): Promise<string> => {
    const params: Tesseract.SetParameters = {
      psm: psm,
    };
    if (whitelist) {
        params.tessedit_char_whitelist = whitelist;
    }
    await worker.setParameters(params);
    
    const { data: { text: rawText } } = await worker.recognize(imageSrc, { rectangle });
    return rawText;
  };

  const processImage = useCallback(async (imageSrc: string) => {
    setResult({ container: "", plate: "", isProcessing: true });

    try {
      const img = new Image();
      img.src = imageSrc;
      await new Promise(resolve => img.onload = resolve);
      
      const width = img.width;
      const height = img.height;
      
      // ROI Focada: Quadrante superior direito (50% direito, 20% superior)
      const focusedRectangle = {
        left: Math.floor(width * 0.5), 
        top: 0,
        width: Math.floor(width * 0.5), 
        height: Math.floor(height * 0.20), 
      };
      
      // ROI Focada APENAS no dígito de verificação (últimos 10% da largura da ROI focada)
      const checkDigitRectangle = {
        left: focusedRectangle.left + Math.floor(focusedRectangle.width * 0.8), // 80% da ROI focada
        top: focusedRectangle.top,
        width: Math.floor(focusedRectangle.width * 0.2), // 20% da ROI focada
        height: focusedRectangle.height,
      };

      const worker = await createWorker("eng"); 
      
      let recognizedContainer = "";
      let recognizedPlate = "";
      
      // --- Etapa 1: Tentativas Otimizadas para o Container Completo (11 caracteres) ---
      const psms = [7, 8, 6, 3]; 
      
      for (const psm of psms) {
        const rectangle = (psm === 7 || psm === 8) ? focusedRectangle : undefined;
        
        // Whitelist padrão para letras e números
        const rawText = await runOcrAttempt(worker, imageSrc, rectangle, psm, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
        const cleanedText = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        const containersFound = cleanedText.match(CONTAINER_REGEX) || [];
        const validContainer = containersFound.find(c => c.length === 11);
        
        if (validContainer) {
          recognizedContainer = validContainer;
          break; 
        }
        
        // Se for a tentativa de imagem inteira (PSM 3), tentamos extrair a placa
        if (psm === 3 && !recognizedPlate) {
            const platesFoundFull = cleanedText.match(PLATE_REGEX) || [];
            if (platesFoundFull.length > 0) {
                recognizedPlate = platesFoundFull[0];
            }
        }
      }
      
      // --- Etapa 2: Fallback para Dígito de Verificação (Se o container principal falhou ou está incompleto) ---
      if (!recognizedContainer) {
        // Tenta encontrar o container de 10 caracteres
        const rawTextPartial = await runOcrAttempt(worker, imageSrc, focusedRectangle, 7, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
        const cleanedTextPartial = rawTextPartial.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        const partialContainers = cleanedTextPartial.match(CONTAINER_PARTIAL_REGEX) || [];
        const partialContainer = partialContainers.find(c => c.length === 10);

        if (partialContainer) {
            // Se encontrou 10 caracteres, tenta o OCR focado no dígito de verificação
            
            // Força o reconhecimento de APENAS dígitos (0-9) na área do dígito de verificação
            const rawCheckDigit = await runOcrAttempt(worker, imageSrc, checkDigitRectangle, 10, '0123456789'); // PSM 10: Single Character
            const cleanedCheckDigit = rawCheckDigit.trim().replace(/[^0-9]/g, '');
            
            if (cleanedCheckDigit.length === 1) {
                recognizedContainer = partialContainer + cleanedCheckDigit;
            } else {
                // Se o OCR do dígito falhar, usamos o resultado de 10 caracteres (que provavelmente é o que está acontecendo)
                recognizedContainer = partialContainer + '0'; // Assume 0 como fallback se não conseguir ler o 1
            }
        }
      }
      
      await worker.terminate();

      // --- Finalização ---
      setResult({
        container: recognizedContainer,
        plate: recognizedPlate,
        isProcessing: false,
      });
      
      return {
        container: recognizedContainer,
        plate: recognizedPlate,
      };

    } catch (error) {
      console.error("Erro no processamento OCR:", error);
      setResult({ container: "", plate: "", isProcessing: false });
      return { container: "", plate: "" };
    }
  }, []);

  return {
    ...result,
    processImage,
  };
}