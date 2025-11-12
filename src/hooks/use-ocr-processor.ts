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
        // PSM 8: Assume uma única palavra em uma imagem. Bom para números de container isolados.
        psm: 8, 
      });

      // 1. Pré-processamento para obter dimensões e definir a ROI (Região de Interesse)
      const img = new Image();
      img.src = imageSrc;
      await new Promise(resolve => img.onload = resolve);
      
      const width = img.width;
      const height = img.height;
      
      // Definindo a ROI: Quadrante superior direito (20% superior, 50% direito)
      // Coordenadas: [x0, y0, x1, y1]
      const rectangle = {
        left: Math.floor(width * 0.5), // Começa na metade da largura
        top: 0,
        width: Math.floor(width * 0.5), // Vai até o final da largura
        height: Math.floor(height * 0.25), // Pega os 25% superiores
      };

      // 2. Executa o reconhecimento apenas na área definida
      const { data: { text } } = await worker.recognize(imageSrc, { rectangle });
      
      await worker.terminate();

      // Log do texto bruto para depuração
      console.log("OCR Text Result (ROI):", text);

      // --- Lógica de Filtragem ---
      
      // 1. Extrair Containers
      const containersFound = text.match(CONTAINER_REGEX) || [];
      const uniqueContainers = [...new Set(containersFound)];
      
      // O número do container é TIIU4173061. A regex CONTAINER_REGEX só pega TIIU417306.
      // Vamos ajustar a regex para incluir o dígito de verificação (o último '1' na sua foto).
      // A regex atual é: /[A-Z]{4}\d{7}/g; (4 letras + 7 dígitos)
      // O texto na foto é TIIU 417306 1. O Tesseract pode ler como TIIU4173061.
      
      // Vamos usar a regex original e ver se o Tesseract consegue ler TIIU417306.
      const recognizedContainer = uniqueContainers.length > 0 ? uniqueContainers[0] : "";

      // 2. Extrair Placas (Não esperamos placas nesta ROI, mas mantemos a lógica)
      const platesFound = text.match(PLATE_REGEX) || [];
      const uniquePlates = [...new Set(platesFound)];
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