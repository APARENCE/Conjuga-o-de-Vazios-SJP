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

// Mapping of expected header names (case-insensitive, trimmed) to Container keys
const HEADER_MAP: { [key: string]: keyof Container } = {
  'operador': 'operador',
  'motorista entrada': 'motoristaEntrada',
  'placa': 'placa',
  'data entrada': 'dataEntrada',
  'container': 'container',
  'armador': 'armador',
  'tara': 'tara',
  'mgw': 'mgw',
  'tipo': 'tipo',
  'padrão': 'padrao',
  'status (vazio/cheio)': 'statusVazioCheio',
  'data porto': 'dataPorto',
  'freetimearmador': 'freeTimeArmador',
  'demurrage': 'demurrage',
  'prazo(dias)': 'prazoDias',
  'cliente de entrada': 'clienteEntrada',
  'transportadora': 'transportadora',
  'estoque': 'estoque',
  'transportadora saida': 'transportadoraSaida', // Assumindo que o segundo 'TRANSPORTADORA' é 'TRANSPORTADORA SAIDA'
  'status entrega minuta': 'statusEntregaMinuta',
  'status minuta': 'statusMinuta',
  'booking atrelado': 'bookingAtrelado',
  'lacre': 'lacre',
  'cliente saida / destino': 'clienteSaidaDestino',
  'atrelado': 'atrelado',
  'operador saida': 'operadorSaida', // Assumindo que o segundo 'OPERADOR' é 'OPERADOR SAIDA'
  'data da estufagem': 'dataEstufagem',
  'data saida sjp': 'dataSaidaSJP',
  'motorista saida sjp': 'motoristaSaidaSJP',
  'placa saida': 'placaSaida', // Assumindo que o segundo 'PLACA' é 'PLACA SAIDA'
  
  // Mapeamento de campos antigos para novos (para compatibilidade interna)
  'dias restantes': 'prazoDias', // Mapeia o campo antigo para o novo 'prazoDias'
};

export const parseExcelFile = (file: File): Promise<Container[]> => {
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

        // 1. Mapeamento de Cabeçalho
        const rawHeaderRow = jsonData[0];
        const columnMap: { [key: number]: keyof Container } = {};
        let containerColumnIndex: number | null = null;

        rawHeaderRow.forEach((rawHeader, index) => {
          const header = String(rawHeader || '').toLowerCase().trim();
          const mappedKey = HEADER_MAP[header];
          
          if (mappedKey) {
            columnMap[index] = mappedKey;
            if (mappedKey === 'container' && containerColumnIndex === null) {
                containerColumnIndex = index;
            }
          }
        });
        
        if (containerColumnIndex === null) {
          columnMap[4] = 'container'; // Assumindo que CONTAINER está na coluna E (índice 4)
          containerColumnIndex = 4;
        }
        
        // 2. Processamento das Linhas de Dados
        const dataRows = jsonData.slice(1);
        
        const containers: Container[] = dataRows
          .filter(row => row.some(cell => String(cell || '').trim() !== ''))
          .map((row, index) => {
            const partialContainer: Partial<Container> = {
              files: [],
              // Definindo defaults para todos os novos campos
              operador: "", motoristaEntrada: "", placa: "", dataEntrada: "", container: "", armador: "",
              tara: 0, mgw: 0, tipo: "", padrao: "", statusVazioCheio: "", dataPorto: "", freeTimeArmador: 0,
              demurrage: "", prazoDias: 0, clienteEntrada: "", transportadora: "", estoque: "",
              transportadoraSaida: "", statusEntregaMinuta: "", statusMinuta: "", bookingAtrelado: "",
              lacre: "", clienteSaidaDestino: "", atrelado: "", operadorSaida: "", dataEstufagem: "",
              dataSaidaSJP: "", motoristaSaidaSJP: "", placaSaida: "",
              diasRestantes: 0, status: "",
            };

            Object.entries(columnMap).forEach(([colIndexStr, key]) => {
              const colIndex = parseInt(colIndexStr);
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
      // Ordem exata da planilha
      'OPERADOR': c.operador,
      'MOTORISTA ENTRADA': c.motoristaEntrada,
      'PLACA': c.placa,
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
      'TRANSPORTADORA': c.transportadora,
      'ESTOQUE': c.estoque,
      'TRANSPORTADORA SAIDA': c.transportadoraSaida,
      'STATUS ENTREGA MINUTA': c.statusEntregaMinuta,
      'STATUS MINUTA': c.statusMinuta,
      'BOOKING ATRELADO': c.bookingAtrelado,
      'LACRE': c.lacre,
      'CLIENTE SAIDA / DESTINO': c.clienteSaidaDestino,
      'ATRELADO': c.atrelado,
      'OPERADOR SAIDA': c.operadorSaida,
      'DATA DA ESTUFAGEM': c.dataEstufagem,
      'DATA SAIDA SJP': c.dataSaidaSJP,
      'MOTORISTA SAIDA SJP': c.motoristaSaidaSJP,
      'PLACA SAIDA': c.placaSaida,
      // Campos de compatibilidade que não estão na planilha original, mas podem ser úteis
      'STATUS GERAL': c.status,
      'DIAS RESTANTES (COMPAT)': c.diasRestantes,
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Containers');
  XLSX.writeFile(workbook, `containers_${new Date().toISOString().split('T')[0]}.xlsx`);
};