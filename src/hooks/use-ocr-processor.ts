import { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";

// Regex para Container: 4 letras + 7 dígitos.
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

  // Simplificando runOcrAttempt, pois não precisamos mais de rectangle ou psm complexos
  const runOcrAttempt = async (worker: Tesseract.Worker, imageSrc: string): Promise<string> => {
    // Usamos PSM 7 (Assume uma única linha de texto) ou 6 (bloco uniforme) para a imagem já cortada.
    await worker.setParameters({
      psm: 7, 
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    });
    
    const { data: { text: rawText } } = await worker.recognize(imageSrc);
    return rawText;
  };

  const processImage = useCallback(async (imageSrc: string) => {
    setResult({ container: "", plate: "", isProcessing: true });

    try {
      // Inicializa o worker do Tesseract
      const worker = await createWorker("eng"); 
      
      let recognizedContainer = "";
      let recognizedPlate = "";
      
      // --- Etapa 1: Tentativa Otimizada para o Container/Placa na Imagem Cortada ---
      // A imagem já está cortada para focar no número do container.
      const rawText = await runOcrAttempt(worker, imageSrc);
      
      // Limpa o texto: remove espaços, quebras de linha e caracteres especiais
      const cleanedText = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      console.log(`OCR Attempt - Cleaned Text:`, cleanedText);

      // 1. Extrair Containers
      const containersFound = cleanedText.match(CONTAINER_REGEX) || [];
      const uniqueContainers = [...new Set(containersFound)];
      
      if (uniqueContainers.length > 0) {
        const validContainer = uniqueContainers.find(c => c.length === 11);
        if (validContainer) {
          recognizedContainer = validContainer;
          console.log("Container found:", recognizedContainer);
        }
      }
      
      // 2. Extrair Placa (Se o container não foi encontrado, ou se a placa estiver na mesma área)
      if (!recognizedContainer) {
          const platesFound = cleanedText.match(PLATE_REGEX) || [];
          if (platesFound.length > 0) {
              recognizedPlate = platesFound[0];
              console.log("Plate found:", recognizedPlate);
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