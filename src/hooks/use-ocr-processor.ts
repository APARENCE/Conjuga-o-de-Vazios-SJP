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

  const processImage = useCallback(async (imageSrc: string) => {
    setResult({ container: "", plate: "", isProcessing: true });

    try {
      // Inicializa o worker do Tesseract
      const worker = await createWorker("eng"); 

      // Configurações para focar em caracteres alfanuméricos
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        // PSM 8: Assume uma única palavra em uma imagem. Ideal para a ROI do container.
        psm: 8, 
      });

      // 1. Pré-processamento para obter dimensões e definir a ROI (Região de Interesse)
      const img = new Image();
      img.src = imageSrc;
      await new Promise(resolve => img.onload = resolve);
      
      const width = img.width;
      const height = img.height;
      
      // Definindo a ROI: Quadrante superior direito (50% direito, 15% superior)
      const rectangle = {
        left: Math.floor(width * 0.5), 
        top: 0,
        width: Math.floor(width * 0.5), 
        height: Math.floor(height * 0.15), // Focando nos 15% superiores
      };

      // 2. Executa o reconhecimento apenas na área definida
      const { data: { text: rawText } } = await worker.recognize(imageSrc, { rectangle });
      
      await worker.terminate();

      // Limpa o texto: remove espaços, quebras de linha e caracteres especiais
      const cleanedText = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Log do texto bruto e limpo para depuração
      console.log("OCR Text Result (ROI):", rawText);
      console.log("OCR Cleaned Text:", cleanedText);

      // --- Lógica de Filtragem ---
      
      // 1. Extrair Containers
      // Aplicamos a regex no texto limpo
      const containersFound = cleanedText.match(CONTAINER_REGEX) || [];
      const uniqueContainers = [...new Set(containersFound)];
      
      // Prioriza o primeiro container válido encontrado
      const recognizedContainer = uniqueContainers.length > 0 ? uniqueContainers[0] : "";

      // 2. Extrair Placas (Não esperamos placas nesta ROI)
      const recognizedPlate = ""; 

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