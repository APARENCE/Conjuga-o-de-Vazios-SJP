import { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";

// Regex para Container (4 letras + 7 dígitos)
const CONTAINER_REGEX = /[A-Z]{4}\d{7}/g;
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

  const runOcrAttempt = async (worker: Tesseract.Worker, imageSrc: string, rectangle: Tesseract.Rectangle, psm: number): Promise<string> => {
    await worker.setParameters({
      psm: psm,
    });
    const { data: { text: rawText } } = await worker.recognize(imageSrc, { rectangle });
    return rawText;
  };

  const processImage = useCallback(async (imageSrc: string) => {
    setResult({ container: "", plate: "", isProcessing: true });

    try {
      // 1. Pré-processamento para obter dimensões e definir a ROI
      const img = new Image();
      img.src = imageSrc;
      await new Promise(resolve => img.onload = resolve);
      
      const width = img.width;
      const height = img.height;
      
      // ROI: Quadrante superior direito (50% direito, 20% superior)
      // Aumentamos ligeiramente a altura para 20% para capturar o número completo, mas mantemos o foco no topo.
      const rectangle = {
        left: Math.floor(width * 0.5), 
        top: 0,
        width: Math.floor(width * 0.5), 
        height: Math.floor(height * 0.20), 
      };

      // Inicializa o worker do Tesseract
      const worker = await createWorker("eng"); 
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      });

      // --- Múltiplas Tentativas de OCR ---
      const psms = [8, 6, 3]; // PSM 8 (Single word), 6 (Uniform block), 3 (Default)
      let recognizedContainer = "";
      
      for (const psm of psms) {
        const rawText = await runOcrAttempt(worker, imageSrc, rectangle, psm);
        
        // Limpa o texto: remove espaços, quebras de linha e caracteres especiais
        const cleanedText = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        console.log(`OCR Attempt PSM ${psm} - Cleaned Text:`, cleanedText);

        // Extrair Containers
        const containersFound = cleanedText.match(CONTAINER_REGEX) || [];
        const uniqueContainers = [...new Set(containersFound)];
        
        if (uniqueContainers.length > 0) {
          recognizedContainer = uniqueContainers[0];
          console.log(`Container found with PSM ${psm}:`, recognizedContainer);
          break; // Encontrou, pode parar
        }
      }
      
      await worker.terminate();

      // --- Finalização ---
      setResult({
        container: recognizedContainer,
        plate: "",
        isProcessing: false,
      });
      
      return {
        container: recognizedContainer,
        plate: "",
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