import * as XLSX from 'xlsx';
import { Container } from '@/types/container';

// Helper function to convert Excel date serial number or string date to DD/MM/YYYY format
const excelDateToJSDate = (serial: any): string => {
  if (!serial || serial === "-" || serial === "") return "";
  
  let date: Date | null = null;

  if (typeof serial === "number") {
    // Excel stores dates as numbers (days since 1900-01-01)
    const utc_days = Math.floor(serial - 25569);
    date = new Date(utc_days * 86400 * 1000);
    
    if (isNaN(date.getTime())) {
        date = null;
    }
  } 
  
  if (typeof serial === "string") {
    const brMatch = serial.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (brMatch) {
        // DD/MM/YYYY
        date = new Date(`${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`);
    } else {
        date = new Date(serial);
    }

    if (!date || isNaN(date.getTime())) {
        return serial;
    }
  }

  if (date && !isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    
    return `${day}/${month}/${year}`;
  }
  
  return String(serial);
};

// Ordem exata das chaves da interface Container, correspondendo à ordem da planilha (30 colunas).
const CONTAINER_KEYS_ORDER: (keyof Container)[] = [
  'operador', // 1. OPERADOR1
  'motoristaEntrada', // 2. MOTORISTA ENTRADA
  'placa', // 3. PLACA1 (Entrada)
  'dataEntrada', // 4. DATA ENTRADA
  'container', // 5. CONTAINER
  'armador', // 6. ARMADOR
  'tara', // 7. TARA
  'mgw', // 8. MGW
  'tipo', // 9. TIPO
  'padrao', // 10. PADRÃO
  'statusVazioCheio', // 11. STATUS (VAZIO/CHEIO)
  'dataPorto', // 12. DATA PORTO
  'freeTimeArmador', // 13. FREETimearmador
  'demurrage', // 14. Demurrage
  'prazoDias', // 15. Prazo(dias)
  'clienteEntrada', // 16. CLIENTE DE ENTRADA
  'transportadora', // 17. TRANSPORTADORA (Entrada)
  'estoque', // 18. ESTOQUE
  'transportadoraSaida', // 19. TRANSPORTADORA (Saída)
  'statusEntregaMinuta', // 20. STATUS ENTREGA MINUTA
  'statusMinuta', // 21. STATUS MINUTA
  'bookingAtrelado', // 22. BOOKING ATRELADO
  'lacre', // 23. LACRE
  'clienteSaidaDestino', // 24. CLIENTE SAIDA / DESTINO
  'atrelado', // 25. ATRELADO
  'operadorSaida', // 26. OPERADOR (Saída)
  'dataEstufagem', // 27. DATA DA ESTUFAGEM
  'dataSaidaSJP', // 28. DATA SAIDA SJP
  'motoristaSaidaSJP', // 29. MOTORISTA SAIDA SJP
  'placaSaida', // 30. PLACA (Saída)
];


export const parseExcelFile = (file: File): Promise<Container[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Lendo como array de arrays (raw: false para manter formatação de data)
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true, raw: false });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Usamos header: 1 para obter o cabeçalho na primeira linha e os dados nas seguintes
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: "" }) as any[][];
        
        if (jsonData.length < 2) {
          return resolve([]);
        }

        // A primeira linha é o cabeçalho, vamos usá-la para verificar o número de colunas
        const headerRow = jsonData[0];
        const dataRows = jsonData.slice(1);
        
        if (headerRow.length < CONTAINER_KEYS_ORDER.length) {
             console.warn(`Aviso: A planilha tem ${headerRow.length} colunas, mas ${CONTAINER_KEYS_ORDER.length} são esperadas. Verifique se há colunas vazias no final.`);
        }

        const containers: Container[] = dataRows
          .filter(row => row.some(cell => String(cell || '').trim() !== ''))
          .map((row, index) => {
            const partialContainer: Partial<Container> = {
              files: [],
              // Definindo defaults para todos os campos
              operador: "", motoristaEntrada: "", placa: "", dataEntrada: "", container: "", armador: "",
              tara: 0, mgw: 0, tipo: "", padrao: "", statusVazioCheio: "", dataPorto: "", freeTimeArmador: 0,
              demurrage: "", prazoDias: 0, clienteEntrada: "", transportadora: "", estoque: "",
              transportadoraSaida: "", statusEntregaMinuta: "", statusMinuta: "", bookingAtrelado: "",
              lacre: "", clienteSaidaDestino: "", atrelado: "", operadorSaida: "", dataEstufagem: "",
              dataSaidaSJP: "", motoristaSaidaSJP: "", placaSaida: "",
              diasRestantes: 0, status: "",
            };

            // Mapeamento por índice
            CONTAINER_KEYS_ORDER.forEach((key, colIndex) => {
              let value = row[colIndex] ?? ""; 

              if (['tara', 'mgw', 'freeTimeArmador', 'prazoDias'].includes(key)) {
                // Trata valores numéricos
                const numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
                partialContainer[key] = isNaN(numericValue) ? 0 : numericValue;
              } else if (['dataEntrada', 'dataPorto', 'dataEstufagem', 'dataSaidaSJP'].includes(key)) {
                // Trata campos de data
                partialContainer[key] = excelDateToJSDate(value);
              } else {
                // Trata todos os outros campos como string
                partialContainer[key] = String(value).trim();
              }
            });
            
            // Mapeamento de compatibilidade: diasRestantes = prazoDias
            partialContainer.diasRestantes = partialContainer.prazoDias;
            
            // Mapeamento de compatibilidade: status (usando statusVazioCheio como fallback)
            // Se o status geral não for fornecido na planilha, usamos o status Vazio/Cheio
            partialContainer.status = partialContainer.status || partialContainer.statusVazioCheio || "";


            const containerValue = String(partialContainer.container || '').trim();
            // Garante que o ID seja único, mesmo se o container estiver vazio (embora não deva)
            const id = containerValue || `import-${Date.now()}-${index}`;

            return {
              ...partialContainer,
              id: id,
              container: containerValue,
            } as Container;
          });
        
        resolve(containers);
      } catch (error) {
        console.error("Erro durante o parsing do Excel:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const exportToExcel = (containers: Container[]) => {
  const worksheet = XLSX.utils.json_to_sheet(
    containers.map(c => ({
      // Ordem exata da planilha (usando os nomes de cabeçalho fornecidos pelo usuário)
      'OPERADOR1': c.operador,
      'MOTORISTA ENTRADA': c.motoristaEntrada,
      'PLACA1': c.placa,
      'DATA ENTRADA': c.dataEntrada,
      'CONTAINER': c.container,
      'ARMADOR': c.armador,
      'TARA': c.tara,
      'MGW': c.mgw,
      'TIPO': c.tipo,
      'PADRÃO': c.padrao,
      'STATUS (VAZIO/CHEIO)': c.statusVazioCheio,
      'DATA PORTO': c.dataPorto,
      'FREETimearmador': c.freeTimeArmador,
      'Demurrage': c.demurrage,
      'Prazo(dias)': c.prazoDias,
      'CLIENTE DE ENTRADA': c.clienteEntrada,
      'TRANSPORTADORA': c.transportadora, // Entrada
      'ESTOQUE': c.estoque,
      'TRANSPORTADORA SAIDA': c.transportadoraSaida, // Saída
      'STATUS ENTREGA MINUTA': c.statusEntregaMinuta,
      'STATUS MINUTA': c.statusMinuta,
      'BOOKING ATRELADO': c.bookingAtrelado,
      'LACRE': c.lacre,
      'CLIENTE SAIDA / DESTINO': c.clienteSaidaDestino,
      'ATRELADO': c.atrelado,
      'OPERADOR SAIDA': c.operadorSaida, // Saída
      'DATA DA ESTUFAGEM': c.dataEstufagem,
      'DATA SAIDA SJP': c.dataSaidaSJP,
      'MOTORISTA SAIDA SJP': c.motoristaSaidaSJP,
      'PLACA SAIDA': c.placaSaida, // Saída
      // Campos de compatibilidade que não estão na planilha original, mas podem ser úteis
      'STATUS GERAL': c.status,
      'DIAS RESTANTES (COMPAT)': c.diasRestantes,
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Containers');
  XLSX.writeFile(workbook, `containers_${new Date().toISOString().split('T')[0]}.xlsx`);
};