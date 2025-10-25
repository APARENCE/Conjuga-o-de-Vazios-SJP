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
  'conteinner': 'container',
  'nº container': 'container',
  'n container': 'container',
  'CONTAINER': 'container', 
  
  // Armador/Shipping Line
  'armador': 'armador',
  'linha': 'armador',
  'ARMADOR': 'armador', 
  
  // Dates and Times
  'data de operação': 'dataOperacao',
  'data operacao': 'dataOperacao',
  'data op': 'dataOperacao',
  'data porto': 'dataPorto',
  'data de devolução': 'dataDevolucao',
  'data devolucao': 'dataDevolucao',
  'data dev': 'dataDevolucao',
  
  // Financial/Time Metrics
  'demurrage': 'demurrage',
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
  'baixa patio': 'baixaPatio',
  'container troca': 'containerTroca',
  'armador troca': 'armadorTroca',
  'depot de devolução': 'depotDevolucao',
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
        // Use raw: false to keep formatted strings (results of formulas), and cellDates for date conversion
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true, raw: false });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Read data including header
        // Use defval: "" to ensure empty cells are read as empty strings, not undefined/null
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: "" }) as any[][];
        
        if (jsonData.length < 2) { // Need at least header + one data row
          return resolve([]);
        }

        // 1. Identify Header Row and create index map
        const rawHeaderRow = jsonData[0];
        const columnMap: { [key: number]: keyof Container } = {};

        rawHeaderRow.forEach((rawHeader, index) => {
          const header = String(rawHeader || '').toLowerCase().trim();
          
          // 1. Tenta mapear pelo nome do cabeçalho
          if (HEADER_MAP[header]) {
            columnMap[index] = HEADER_MAP[header];
          }
          
          // 2. Mapeamento obrigatório para as primeiras colunas (A e B) se o mapeamento falhar
          if (index === 0 && !columnMap[index]) {
             columnMap[index] = 'container';
          } else if (index === 1 && !columnMap[index]) {
             columnMap[index] = 'armador';
          }
        });
        
        // 2. Process Data Rows (starting from index 1)
        const rows = jsonData.slice(1);
        
        const containers: Container[] = rows
          // Filtra linhas que são completamente vazias
          .filter(row => row.some(cell => String(cell || '').trim() !== ''))
          .map((row, index) => {
            const container: Partial<Container> = {
              id: `import-${Date.now()}-${index}`, // Generate unique ID
              files: [],
            };

            Object.keys(columnMap).forEach(colIndexStr => {
              const colIndex = parseInt(colIndexStr);
              const key = columnMap[colIndex];
              // Ensure value is read, defaulting to empty string if null/undefined
              let value = row[colIndex] ?? ""; 

              // Tratamento de valor: Garante que o valor é uma string limpa, a menos que seja um campo numérico ou de data.
              if (key === 'freeTime' || key === 'diasRestantes') {
                // Tenta converter para número. Se for string, tenta parsear.
                const numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
                container[key] = isNaN(numericValue) ? 0 : numericValue;
              } else if (key === 'dataOperacao' || key === 'dataPorto' || key === 'demurrage' || key === 'dataDevolucao') {
                // Converte data serial do Excel ou string de data para DD/MM/YYYY
                container[key] = excelDateToJSDate(value);
              } else {
                // Trata todos os outros campos como strings, garantindo que sejam limpos
                container[key] = String(value).trim();
              }
            });

            // Ensure all required fields are present, even if empty strings, for type safety
            return {
              container: container.container || '',
              armador: container.armador || '',
              dataOperacao: container.dataOperacao || '',
              dataPorto: container.dataPorto || '',
              demurrage: container.demurrage || '',
              freeTime: container.freeTime || 0,
              diasRestantes: container.diasRestantes || 0,
              placas: container.placas || '',
              motorista: container.motorista || '',
              origem: container.origem || '',
              baixaPatio: container.baixaPatio || '',
              containerTroca: container.containerTroca || '',
              armadorTroca: container.armadorTroca || '',
              depotDevolucao: container.depotDevolucao || '',
              dataDevolucao: container.dataDevolucao || '',
              status: container.status || '',
              id: container.id!,
              files: container.files,
            } as Container;
          })
          // Filtro final: requer pelo menos o container OU armador preenchido
          .filter(c => c.container || c.armador);
        
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
      'DATA DE OPERAÇÃO': c.dataOperacao,
      'DATA PORTO': c.dataPorto,
      'DEMURRAGE': c.demurrage,
      'FREE TIME': c.freeTime,
      'DIAS RESTANTES': c.diasRestantes,
      'PLACAS': c.placas,
      'MOTORISTA': c.motorista,
      'ORIGEM': c.origem,
      'BAIXA PATIO SJP': c.baixaPatio,
      'CONTAINER TROCA': c.containerTroca,
      'ARMADOR TROCA': c.armadorTroca,
      'DEPOT DE DEVOLUÇÃO': c.depotDevolucao,
      'DATA DE DEVOLUÇÃO': c.dataDevolucao,
      'STATUS': c.status,
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Containers');
  XLSX.writeFile(workbook, `containers_${new Date().toISOString().split('T')[0]}.xlsx`);
};