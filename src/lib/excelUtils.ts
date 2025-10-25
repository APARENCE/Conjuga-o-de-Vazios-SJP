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
  } else if (typeof serial === "string") {
    // Tenta parsear strings comuns de data
    
    // 1. Formato ISO (YYYY-MM-DD)
    const isoMatch = serial.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      date = new Date(serial);
    } 
    
    // 2. Formato Americano (MM/DD/YYYY ou MM/DD/YY)
    const usMatch = serial.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (usMatch) {
      // Tenta criar a data no formato MM/DD/YYYY
      date = new Date(`${usMatch[1]}/${usMatch[2]}/${usMatch[3]}`);
    }
    
    // 3. Formato Brasileiro (DD/MM/YYYY ou DD/MM/YY) - Se já estiver nesse formato, apenas retorna
    const brMatch = serial.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (brMatch && !date) {
        // Se não foi reconhecido como US, assume BR e retorna a string original
        return serial;
    }

    // Se não conseguiu parsear como data, retorna a string original
    if (!date || isNaN(date.getTime())) {
        return serial;
    }
  }

  if (date && !isNaN(date.getTime())) {
    // Formata DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    
    return `${day}/${month}/${year}`;
  }
  
  return String(serial);
};

// Mapping of expected header names (case-insensitive, trimmed) to Container keys
const HEADER_MAP: { [key: string]: keyof Container } = {
  // Container Identification
  'container': 'container',
  'conteiner': 'container', // Coluna A (Principal)
  'nº container': 'container',
  'n container': 'container',
  
  // Container Troca
  'conteinner': 'containerTroca', // Coluna M (Troca)
  'container troca': 'containerTroca',
  'troca conteinner': 'containerTroca',
  
  // Armador/Shipping Line
  'armador': 'armador', // Coluna B (Principal)
  'linha': 'armador',
  
  // Armador Troca
  'armador troca': 'armadorTroca', // Coluna N (Troca)
  'troca armador': 'armadorTroca',
  'armadortroca': 'armadorTroca', // Variação sem espaço
  
  // Dates and Times
  'data de operação': 'dataOperacao',
  'data operacao': 'dataOperacao',
  'data operação': 'dataOperacao',
  'data op': 'dataOperacao',
  'data porto': 'dataPorto',
  'data chegada porto': 'dataPorto',
  'data de devolução': 'dataDevolucao',
  'data devolucao': 'dataDevolucao',
  'data devolução': 'dataDevolucao',
  'data dev': 'dataDevolucao',
  
  // Financial/Time Metrics
  'demurrage': 'demurrage',
  'vencimento demurrage': 'demurrage',
  'free time': 'freeTime',
  'freetime': 'freeTime',
  'dias restantes': 'diasRestantes',
  'diasrestantes': 'diasRestantes',
  'dias free': 'diasRestantes',
  
  // Logistics
  'placas': 'placas',
  'placa': 'placas',
  'motorista': 'motorista',
  'origem': 'origem',
  'baixa patio sjp': 'baixaPatio',
  'baixa pátio sjp': 'baixaPatio',
  'baixa patio': 'baixaPatio',
  'baixa pátio': 'baixaPatio',
  'depot de devolução': 'depotDevolucao',
  'depot devolução': 'depotDevolucao',
  'depot devolucao': 'depotDevolucao',
  'depot': 'depotDevolucao',
  'status': 'status',
  'situação': 'status',
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
            
            // Rastreia o índice da coluna principal do container
            if (mappedKey === 'container' && containerColumnIndex === null) {
                containerColumnIndex = index;
            }
          }
        });
        
        // Fallback: Se a coluna A (índice 0) não foi mapeada pelo nome do cabeçalho,
        // assume-se que é 'container' por padrão.
        if (containerColumnIndex === null) {
          columnMap[0] = 'container';
          containerColumnIndex = 0;
        }
        
        // 2. Processamento das Linhas de Dados
        const dataRows = jsonData.slice(1);
        
        const containers: Container[] = dataRows
          // Filtra linhas que são completamente vazias
          .filter(row => row.some(cell => String(cell || '').trim() !== ''))
          .map((row, index) => {
            const partialContainer: Partial<Container> = {
              files: [],
            };

            Object.entries(columnMap).forEach(([colIndexStr, key]) => {
              const colIndex = parseInt(colIndexStr);
              let value = row[colIndex] ?? ""; 

              if (key === 'freeTime' || key === 'diasRestantes') {
                // Trata valores numéricos, aceitando vírgula como separador decimal
                const numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
                partialContainer[key] = isNaN(numericValue) ? 0 : numericValue;
              } else if (['dataOperacao', 'dataPorto', 'demurrage', 'dataDevolucao'].includes(key)) {
                // Trata campos de data
                partialContainer[key] = excelDateToJSDate(value);
              } else {
                // Trata todos os outros campos como string
                partialContainer[key] = String(value).trim();
              }
            });

            // Usa o valor do container como ID, com fallback para um ID gerado
            const containerValue = String(partialContainer.container || '').trim();
            const id = containerValue || `import-${Date.now()}-${index}`;

            // Garante que o objeto final tenha a estrutura completa de 'Container'
            return {
              id: id,
              container: containerValue,
              armador: partialContainer.armador || '',
              dataOperacao: partialContainer.dataOperacao || '',
              dataPorto: partialContainer.dataPorto || '',
              demurrage: partialContainer.demurrage || '',
              freeTime: partialContainer.freeTime || 0,
              diasRestantes: partialContainer.diasRestantes || 0,
              placas: partialContainer.placas || '',
              motorista: partialContainer.motorista || '',
              origem: partialContainer.origem || '',
              baixaPatio: partialContainer.baixaPatio || '',
              containerTroca: partialContainer.containerTroca || '',
              armadorTroca: partialContainer.armadorTroca || '',
              depotDevolucao: partialContainer.depotDevolucao || '',
              dataDevolucao: partialContainer.dataDevolucao || '',
              status: partialContainer.status || '',
              files: partialContainer.files || [],
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
      'CONTAINER': c.container,
      'ARMADOR': c.armador,
      'DATA OPERAÇÃO': c.dataOperacao,
      'DATA PORTO': c.dataPorto,
      'DEMURRAGE': c.demurrage,
      'FREE TIME': c.freeTime,
      'DIAS RESTANTES': c.diasRestantes,
      'PLACAS': c.placas,
      'MOTORISTA': c.motorista,
      'ORIGEM': c.origem,
      'BAIXA PÁTIO SJP': c.baixaPatio,
      'CONTAINER TROCA': c.containerTroca,
      'ARMADOR TROCA': c.armadorTroca,
      'DEPOT DEVOLUÇÃO': c.depotDevolucao,
      'DATA DEVOLUÇÃO': c.dataDevolucao,
      'STATUS': c.status,
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Containers');
  XLSX.writeFile(workbook, `containers_${new Date().toISOString().split('T')[0]}.xlsx`);
};