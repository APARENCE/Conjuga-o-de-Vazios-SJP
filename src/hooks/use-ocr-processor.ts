import { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";

// Regex para Container: 4 letras + 7 dígitos.
// Mantemos a regex estrita, mas confiamos na limpeza do texto para juntar os caracteres.
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

  const runOcrAttempt = async (worker: Tesseract.Worker, imageSrc: string, rectangle: Tesseract.Rectangle | undefined, psm: number): Promise<string> => {
    await worker.setParameters({
      psm: psm,
    });
    // Se rectangle for undefined, reconhece a imagem inteira
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
      
      // ROI Focada: Quadrante superior direito (50% direito, 20% superior)
      const focusedRectangle = {
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

      let recognizedContainer = "";
      let recognizedPlate = "";
      
      // --- Tentativas Otimizadas (PSM 7, 8, 6, 3) ---
      // PSM 7 (Single Text Line) é bom para números longos.
      // PSM 8 (Single Word) é bom para caracteres isolados.
      const psms = [7, 8, 6, 3]; 
      
      for (const psm of psms) {
        // Usamos a ROI focada para PSM 7 e 8, e a imagem inteira para PSM 6 e 3.
        const rectangle = (psm === 7 || psm === 8) ? focusedRectangle : undefined;
        
        const rawText = await runOcrAttempt(worker, imageSrc, rectangle, psm);
        
        // Limpa o texto: remove espaços, quebras de linha e caracteres especiais
        const cleanedText = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        console.log(`OCR Attempt PSM ${psm} - Cleaned Text:`, cleanedText);

        // Extrair Containers
        const containersFound = cleanedText.match(CONTAINER_REGEX) || [];
        const uniqueContainers = [...new Set(containersFound)];
        
        if (uniqueContainers.length > 0) {
          // Filtra para garantir que estamos pegando o padrão de 11 caracteres
          const validContainer = uniqueContainers.find(c => c.length === 11);
          if (validContainer) {
            recognizedContainer = validContainer;
            console.log(`Container found with PSM ${psm}:`, recognizedContainer);
            break; // Encontrou, pode parar
          }
        }
        
        // Tentativa de extrair placa (apenas na tentativa de imagem inteira PSM 3, se ainda não tivermos uma placa)
        if (psm === 3 && !recognizedPlate) {
            const platesFoundFull = cleanedText.match(PLATE_REGEX) || [];
            if (platesFoundFull.length > 0) {
                recognizedPlate = platesFoundFull[0];
                console.log("Plate found with FULL IMAGE PSM 3:", recognizedPlate);
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