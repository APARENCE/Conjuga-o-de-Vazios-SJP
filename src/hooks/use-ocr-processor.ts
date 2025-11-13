import { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { CONTAINER_PREFIXES } from "@/data/containerPrefixes"; // Importando prefixos

// Regex para Container: 4 letras + 7 dígitos.
// Usamos uma regex mais ampla para capturar sequências de 11 caracteres alfanuméricos
const CONTAINER_PATTERN = /([A-Z]{4}\d{7})|([A-Z]{4}\s*\d{7})|([A-Z]{4}\d{6}\s*\d)|([A-Z]{4}\d{5}\s*\d{2})/g;

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
    // Usamos PSM 7 (Assume uma única linha de texto) para a imagem já cortada.
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
      const worker = await createWorker("eng"); 
      
      let recognizedContainer = "";
      let recognizedPlate = "";
      
      const rawText = await runOcrAttempt(worker, imageSrc);
      
      // Limpa o texto: remove caracteres especiais, mas mantém espaços e quebras de linha por enquanto
      const semiCleanedText = rawText.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
      
      // 1. Tenta encontrar o padrão de 11 caracteres (4 letras + 7 dígitos)
      // Remove todos os espaços para criar uma string contínua de alfanuméricos
      const continuousText = semiCleanedText.replace(/\s/g, '');
      
      // Regex para encontrar 4 letras seguidas por 7 dígitos em qualquer lugar da string contínua
      const fullContainerRegex = /([A-Z]{4}\d{7})/;
      const match = continuousText.match(fullContainerRegex);

      if (match && match[1]) {
        recognizedContainer = match[1];
      } else {
        // Se a regex falhar, tentamos uma abordagem mais manual:
        // 1. Encontrar um prefixo conhecido (TIIU, MAEU, etc.)
        // 2. Extrair os próximos 7 dígitos após o prefixo
        
        const prefixMatch = CONTAINER_PREFIXES.find(prefix => continuousText.includes(prefix));
        
        if (prefixMatch) {
            const startIndex = continuousText.indexOf(prefixMatch) + 4;
            const potentialDigits = continuousText.substring(startIndex);
            
            // Pega os primeiros 7 dígitos da sequência
            const digitsMatch = potentialDigits.match(/\d{7}/);
            
            if (digitsMatch && digitsMatch[0]) {
                recognizedContainer = prefixMatch + digitsMatch[0];
            }
        }
      }
      
      // 2. Extrair Placa (Se o container não foi encontrado)
      if (!recognizedContainer) {
          // Usamos o texto semi-limpo (com espaços) para a placa, pois placas podem ter espaços
          const platesFound = semiCleanedText.match(PLATE_REGEX) || [];
          if (platesFound.length > 0) {
              recognizedPlate = platesFound[0].replace(/\s/g, ''); // Remove espaços da placa final
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