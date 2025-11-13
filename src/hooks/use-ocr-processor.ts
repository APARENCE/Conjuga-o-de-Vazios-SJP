import { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { CONTAINER_PREFIXES } from "@/data/containerPrefixes";
import { validateAndCorrectContainer } from "@/lib/containerUtils"; // Importando utilitário de validação

// Regex para Container: 4 letras + 6 dígitos (o 7º dígito será corrigido/calculado).
// Procuramos por sequências de 10 ou 11 caracteres alfanuméricos.
const CONTAINER_SEARCH_PATTERN = /([A-Z]{4}\d{6,7})/;

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

  const runOcrAttempt = async (worker: Tesseract.Worker, imageSrc: string): Promise<string> => {
    // Usamos PSM 6 (Assume um bloco uniforme de texto) para tentar melhorar a precisão em números longos.
    await worker.setParameters({
      psm: 6, 
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    });
    
    const { data: { text: rawText } } = await worker.recognize(imageSrc);
    return rawText;
  };

  const processImage = useCallback(async (imageSrc: string) => {
    setResult({ container: "", plate: "", isProcessing: true });

    try {
      const worker = await createWorker("eng"); 
      
      let recognizedContainer = "";
      let recognizedPlate = "";
      
      const rawText = await runOcrAttempt(worker, imageSrc);
      
      // Limpa o texto: remove todos os caracteres que não são letras ou números
      const continuousText = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // 1. Tenta encontrar o padrão de 10 ou 11 caracteres (4 letras + 6/7 dígitos)
      const match = continuousText.match(CONTAINER_SEARCH_PATTERN);
      let potentialContainer = match ? match[1] : null;

      if (potentialContainer) {
        // Tenta validar e corrigir o número encontrado
        const correctedContainer = validateAndCorrectContainer(potentialContainer);
        if (correctedContainer) {
          recognizedContainer = correctedContainer;
        }
      }
      
      // 2. Se a busca por regex falhar, tentamos a abordagem de prefixo e validação
      if (!recognizedContainer) {
        const prefixMatch = CONTAINER_PREFIXES.find(prefix => continuousText.includes(prefix));
        
        if (prefixMatch) {
            const startIndex = continuousText.indexOf(prefixMatch) + 4;
            const potentialDigits = continuousText.substring(startIndex);
            
            // Tenta pegar 6 ou 7 dígitos após o prefixo
            const digitsMatch = potentialDigits.match(/\d{6,7}/);
            
            if (digitsMatch && digitsMatch[0]) {
                const fullPotential = prefixMatch + digitsMatch[0];
                const correctedContainer = validateAndCorrectContainer(fullPotential);
                
                if (correctedContainer) {
                    recognizedContainer = correctedContainer;
                }
            }
        }
      }
      
      // 3. Extrair Placa (Se o container não foi encontrado)
      if (!recognizedContainer) {
          // Para placas, usamos o texto original (rawText) para permitir espaços ou hífens, 
          // mas limpamos o resultado final.
          const platesFound = rawText.toUpperCase().match(PLATE_REGEX) || [];
          if (platesFound.length > 0) {
              recognizedPlate = platesFound[0].replace(/[^A-Z0-9]/g, ''); // Limpa caracteres não alfanuméricos
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