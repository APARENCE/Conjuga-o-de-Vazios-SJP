import { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { CONTAINER_PREFIXES } from "@/data/containerPrefixes"; // Importando prefixos

// Regex para Container: 4 letras + 7 dígitos.
const CONTAINER_PATTERN = /([A-Z]{4}\d{7})/;

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
      const cleanedText = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // 1. Tenta encontrar o padrão de 11 caracteres (4 letras + 7 dígitos)
      const match = cleanedText.match(CONTAINER_PATTERN);

      if (match && match[1]) {
        recognizedContainer = match[1];
      } else {
        // 2. Abordagem de prefixo e validação (mais robusta)
        
        // Itera sobre os prefixos conhecidos
        for (const prefix of CONTAINER_PREFIXES) {
            if (cleanedText.includes(prefix)) {
                const startIndex = cleanedText.indexOf(prefix) + 4;
                const potentialDigits = cleanedText.substring(startIndex);
                
                // Pega os primeiros 7 dígitos da sequência após o prefixo
                const digitsMatch = potentialDigits.match(/\d{7}/);
                
                if (digitsMatch && digitsMatch[0]) {
                    recognizedContainer = prefix + digitsMatch[0];
                    break; // Encontrou, sai do loop
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