import { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";

// Regex para Container (4 letras + 7 dígitos)
const CONTAINER_REGEX = /[A-Z]{4}\d{7}/g;
// Regex para Placa: 3 letras + 4 dígitos (padrão antigo) OU 3 letras + 1 letra/dígito + 3 dígitos (padrão Mercosul)
// Tornando mais flexível: 3 ou 4 letras seguidas por 3 a 4 caracteres alfanuméricos.
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

  const processImage = useCallback(async (imageSrc: string) => {
    setResult({ container: "", plate: "", isProcessing: true });

    try {
      // Inicializa o worker do Tesseract (pode ser lento na primeira vez)
      const worker = await createWorker("eng"); // Usando 'eng' para melhor reconhecimento de caracteres alfanuméricos

      const { data: { text } } = await worker.recognize(imageSrc);
      
      await worker.terminate();

      // Log do texto bruto para depuração
      console.log("OCR Text Result:", text);

      // --- Lógica de Filtragem ---
      
      // 1. Extrair Containers
      const containersFound = text.match(CONTAINER_REGEX) || [];
      const uniqueContainers = [...new Set(containersFound)];
      
      // Prioriza o primeiro container válido encontrado
      const recognizedContainer = uniqueContainers.length > 0 ? uniqueContainers[0] : "";

      // 2. Extrair Placas
      const platesFound = text.match(PLATE_REGEX) || [];
      const uniquePlates = [...new Set(platesFound)];
      
      // Prioriza a primeira placa válida encontrada
      const recognizedPlate = uniquePlates.length > 0 ? uniquePlates[0] : "";

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