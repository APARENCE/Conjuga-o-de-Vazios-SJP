import * as XLSX from 'xlsx';
import { Container } from '@/types/container';

// Helper function to convert DD/MM/YYYY string to object Date (for internal use)
const parseDateString = (dateString: string): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  // Cria a data no formato YYYY-MM-DD para evitar problemas de fuso horário
  const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Formata qualquer valor de data (Date object, string ISO, ou string DD/MM/YYYY) para DD/MM/YYYY.
 * @param dateValue O valor da data.
 * @returns A data formatada como string DD/MM/YYYY ou o valor original se não for uma data válida.
 */
export const formatDateToBR = (dateValue: any): string => {
  if (!dateValue || dateValue === "-" || dateValue === "") return "";
  
  let date: Date | null = null;

  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string') {
    // 1. Tenta parsear strings que já estão em DD/MM/YYYY
    date = parseDateString(dateValue);
    
    // 2. Se falhar, tenta parsear como string ISO ou outro formato
    if (!date) {
        const tempDate = new Date(dateValue);
        // Verifica se a data é válida e se não é a data zero (1970)
        if (!isNaN(tempDate.getTime()) && tempDate.getFullYear() > 1900) {
            date = tempDate;
        }
    }
  }
  
  if (date && !isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    
    return `${day}/${month}/${year}`;
  }
  
  return String(dateValue); // Retorna o valor original se não for uma data válida
};

// Helper function to convert Excel date serial number or string date to DD/MM/YYYY format
const excelDateToJSDate = (serial: any): string => {
  if (!serial || serial === "-" || serial === "") return "";
  
  let date: Date | null = null;

  if (typeof serial === "number") {
    // Excel stores dates as numbers (days since 1900-01-01)
    const utc_days = Math.floor(serial - 25569);
    date = new Date(utc_days * 86400 * 1000);
    
    // Ajuste de fuso horário para garantir que a data seja correta
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

    if (isNaN(date.getTime())) {
        date = null;
    }
  } 
  
  if (typeof serial === "string") {
    // Tenta parsear como DD/MM/YYYY
    const brMatch = serial.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (brMatch) {
        // DD/MM/YYYY
        date = new Date(`${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`);
    } else {
        // Tenta parsear como ISO ou outro formato
        date = new Date(serial);
    }

    if (!date || isNaN(date.getTime())) {
        return serial; // Retorna a string original se não for data
    }
  }

  if (date && !isNaN(date.getTime())) {
    return formatDateToBR(date);
  }
  
  return String(serial);
};

// Ordem exata das chaves da interface Container, correspondendo à nova ordem da planilha (30 colunas).
const CONTAINER_KEYS_ORDER: (keyof Container)[] = [
  'operador', 'motoristaEntrada', 'placa', 'dataEntrada', 'container', 'armador',
  'tara', 'mgw', 'tipo', 'padrao', 'statusVazioCheio', 'dataPorto', 'freeTimeArmador',
  'demurrage', 'prazoDias', 'clienteEntrada', 'transportadora', 'estoque',
  'transportadoraSaida', 'statusEntregaMinuta', 'statusMinuta', 'bookingAtrelado',
  'lacre', 'clienteSaidaDestino', 'atrelado', 'operadorSaida', 'dataEstufagem',
  'dataSaidaSJP', 'motoristaSaidaSJP', 'placaSaida',
];

// Lista de chaves que representam campos de data no objeto Container
const DATE_KEYS: (keyof Container)[] = [
    'dataEntrada', 'dataPorto', 'dataEstufagem', 'dataSaidaSJP'
];

export const parseExcelFile = (file: File): Promise<Partial<Container>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true, raw: false });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: "" }) as any[][];
        
        if (jsonData.length < 2) {
          return resolve([]);
        }

        const dataRows = jsonData.slice(1);
        
        const containers: Partial<Container>[] = dataRows
          .filter(row => row.some(cell => String(cell || '').trim() !== ''))
          .map((row) => {
            const partialContainer: Partial<Container> = {};

            CONTAINER_KEYS_ORDER.forEach((key, colIndex) => {
              let value = row[colIndex] ?? ""; 
              const containerKey = key as keyof Container;

              if (['tara', 'mgw'].includes(key)) {
                const numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
                (partialContainer as any)[containerKey] = isNaN(numericValue) ? 0 : numericValue;
              } else if (['freeTimeArmador', 'prazoDias'].includes(key)) {
                const intValue = typeof value === 'string' ? parseInt(value.replace(/\D/g, ''), 10) : Number(value);
                (partialContainer as any)[containerKey] = isNaN(intValue) ? 0 : Math.round(intValue);
              } else if (DATE_KEYS.includes(key)) {
                (partialContainer as any)[containerKey] = excelDateToJSDate(value);
              } else {
                (partialContainer as any)[containerKey] = String(value).trim();
              }
            });
            
            partialContainer.diasRestantes = partialContainer.prazoDias;
            partialContainer.status = partialContainer.status || partialContainer.statusVazioCheio || "";
            partialContainer.files = [];

            return partialContainer;
          });
        
        resolve(containers);
      } catch (error) {
        console.error("Erro durante o parsing do Excel:", error);
        reject(new Error("Falha ao ler o arquivo Excel. Verifique se o formato está correto."));
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const exportToExcel = (containers: Container[]) => {
  const worksheet = XLSX.utils.json_to_sheet(
    containers.map(c => ({
      'OPERADOR1': c.operador,
      'MOTORISTA ENTRADA': c.motoristaEntrada,
      'PLACA1': c.placa,
      'DATA ENTRADA': formatDateToBR(c.dataEntrada),
      'CONTAINER': c.container,
      'ARMADOR': c.armador,
      'TARA': c.tara,
      'MGW': c.mgw,
      'TIPO': c.tipo,
      'PADRÃO': c.padrao,
      'STATUS (VAZIO/CHEIO)': c.statusVazioCheio,
      'DATA PORTO': formatDateToBR(c.dataPorto),
      'FREETimearmador': c.freeTimeArmador,
      'Demurrage': c.demurrage,
      'Prazo(dias)': c.prazoDias,
      'CLIENTE DE ENTRADA': c.clienteEntrada,
      'TRANSPORTADORA': c.transportadora,
      'ESTOQUE': c.estoque,
      'TRANSPORTADORA SAIDA': c.transportadoraSaida,
      'STATUS ENTREGA MINUTA': c.statusEntregaMinuta,
      'STATUS MINUTA': c.statusMinuta,
      'BOOKING ATRELADO': c.bookingAtrelado,
      'LACRE': c.lacre,
      'CLIENTE SAIDA / DESTINO': c.clienteSaidaDestino,
      'ATRELADO': c.atrelado,
      'OPERADOR': c.operadorSaida,
      'DATA DA ESTUFAGEM': formatDateToBR(c.dataEstufagem),
      'DATA SAIDA SJP': formatDateToBR(c.dataSaidaSJP),
      'MOTORISTA SAIDA SJP': c.motoristaSaidaSJP,
      'PLACA': c.placaSaida,
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Containers');
  XLSX.writeFile(workbook, `containers_${new Date().toISOString().split('T')[0]}.xlsx`);
};