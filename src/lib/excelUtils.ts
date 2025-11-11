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
// ASSUMIMOS QUE 'CONTAINER' É A PRIMEIRA COLUNA.
const CONTAINER_KEYS_ORDER: (keyof Container)[] = [
  'container', // 1. CONTAINER (Movido para a primeira posição)
  'operador', // 2. OPERADOR1 (Originalmente 1)
  'motoristaEntrada', // 3. MOTORISTA ENTRADA (Originalmente 2)
  'placa', // 4. PLACA1 (Entrada) (Originalmente 3)
  'dataEntrada', // 5. DATA ENTRADA (Originalmente 4)
  'armador', // 6. ARMADOR (Originalmente 6)
  'tara', // 7. TARA (Originalmente 7)
  'mgw', // 8. MGW (Originalmente 8)
  'tipo', // 9. TIPO (Originalmente 9)
  'padrao', // 10. PADRÃO (Originalmente 10)
  'statusVazioCheio', // 11. STATUS (VAZIO/CHEIO) (Originalmente 11)
  'dataPorto', // 12. DATA PORTO (Originalmente 12)
  'freeTimeArmador', // 13. FREETimearmador (Originalmente 13)
  'demurrage', // 14. Demurrage (Originalmente 14)
  'prazoDias', // 15. Prazo(dias) (Originalmente 15)
  'clienteEntrada', // 16. CLIENTE DE ENTRADA (Originalmente 16)
  'transportadora', // 17. TRANSPORTADORA (Entrada) (Originalmente 17)
  'estoque', // 18. ESTOQUE (Originalmente 18)
  'transportadoraSaida', // 19. TRANSPORTADORA (Saída) (Originalmente 19)
  'statusEntregaMinuta', // 20. STATUS ENTREGA MINUTA (Originalmente 20)
  'statusMinuta', // 21. STATUS MINUTA (Originalmente 21)
  'bookingAtrelado', // 22. BOOKING ATRELADO (Originalmente 22)
  'lacre', // 23. LACRE (Originalmente 23)
  'clienteSaidaDestino', // 24. CLIENTE SAIDA / DESTINO (Originalmente 24)
  'atrelado', // 25. ATRELADO (Originalmente 25)
  'operadorSaida', // 26. OPERADOR (Saída) (Originalmente 26)
  'dataEstufagem', // 27. DATA DA ESTUFAGEM (Originalmente 27)
  'dataSaidaSJP', // 28. DATA SAIDA SJP (Originalmente 28)
  'motoristaSaidaSJP', // 29. MOTORISTA SAIDA SJP (Originalmente 29)
  'placaSaida', // 30. PLACA (Saída) (Originalmente 30)
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
        
        // Se o número de colunas na planilha for menor que o esperado, pode haver um erro de formato.
        if (headerRow.length < CONTAINER_KEYS_ORDER.length) {
             console.warn(`Aviso: A planilha tem ${headerRow.length} colunas, mas ${CONTAINER_KEYS_ORDER.length} são esperadas.`);
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
      'CONTAINER': c.container, // 1. CONTAINER
      'OPERADOR1': c.operador, // 2. OPERADOR1
      'MOTORISTA ENTRADA': c.motoristaEntrada, // 3. MOTORISTA ENTRADA
      'PLACA1': c.placa, // 4. PLACA1
      'DATA ENTRADA': c.dataEntrada, // 5. DATA ENTRADA
      'ARMADOR': c.armador, // 6. ARMADOR
      'TARA': c.tara, // 7. TARA
      'MGW': c.mgw, // 8. MGW
      'TIPO': c.tipo, // 9. TIPO
      'PADRÃO': c.padrao, // 10. PADRÃO
      'STATUS (VAZIO/CHEIO)': c.statusVazioCheio, // 11. STATUS (VAZIO/CHEIO)
      'DATA PORTO': c.dataPorto, // 12. DATA PORTO
      'FREETimearmador': c.freeTimeArmador, // 13. FREETimearmador
      'Demurrage': c.demurrage, // 14. Demurrage
      'Prazo(dias)': c.prazoDias, // 15. Prazo(dias)
      'CLIENTE DE ENTRADA': c.clienteEntrada, // 16. CLIENTE DE ENTRADA
      'TRANSPORTADORA': c.transportadora, // 17. TRANSPORTADORA (Entrada)
      'ESTOQUE': c.estoque, // 18. ESTOQUE
      'TRANSPORTADORA SAIDA': c.transportadoraSaida, // 19. TRANSPORTADORA (Saída)
      'STATUS ENTREGA MINUTA': c.statusEntregaMinuta, // 20. STATUS ENTREGA MINUTA
      'STATUS MINUTA': c.statusMinuta, // 21. STATUS MINUTA
      'BOOKING ATRELADO': c.bookingAtrelado, // 22. BOOKING ATRELADO
      'LACRE': c.lacre, // 23. LACRE
      'CLIENTE SAIDA / DESTINO': c.clienteSaidaDestino, // 24. CLIENTE SAIDA / DESTINO
      'ATRELADO': c.atrelado, // 25. ATRELADO
      'OPERADOR SAIDA': c.operadorSaida, // 26. OPERADOR (Saída)
      'DATA DA ESTUFAGEM': c.dataEstufagem, // 27. DATA DA ESTUFAGEM
      'DATA SAIDA SJP': c.dataSaidaSJP, // 28. DATA SAIDA SJP
      'MOTORISTA SAIDA SJP': c.motoristaSaidaSJP, // 29. MOTORISTA SAIDA SJP
      'PLACA SAIDA': c.placaSaida, // 30. PLACA (Saída)
      // Campos de compatibilidade que não estão na planilha original, mas podem ser úteis
      'STATUS GERAL': c.status,
      'DIAS RESTANTES (COMPAT)': c.diasRestantes,
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Containers');
  XLSX.writeFile(workbook, `containers_${new Date().toISOString().split('T')[0]}.xlsx`);
};