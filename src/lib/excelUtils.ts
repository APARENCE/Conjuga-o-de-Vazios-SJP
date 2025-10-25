import * as XLSX from 'xlsx';
import { Container } from '@/types/container';

// Helper function to convert Excel date serial number to date string
const excelDateToJSDate = (serial: any): string => {
  if (!serial || serial === "-" || serial === "") return "";
  
  // If it's already a string date, return it
  if (typeof serial === "string") return serial;
  
  // Excel stores dates as numbers (days since 1900-01-01)
  if (typeof serial === "number") {
    // Adjusting for Excel's 1900 leap year bug (25569 is the number of days from 1900-01-01 to 1970-01-01)
    const utc_days = Math.floor(serial - 25569);
    const date_info = new Date(utc_days * 86400 * 1000);
    
    // Format DD/MM/YY
    const day = String(date_info.getDate()).padStart(2, '0');
    const month = String(date_info.getMonth() + 1).padStart(2, '0');
    const year = String(date_info.getFullYear()).slice(-2);
    
    return `${day}/${month}/${year}`;
  }
  
  return String(serial);
};

// Mapping of expected header names (case-insensitive, trimmed) to Container keys
const HEADER_MAP: { [key: string]: keyof Container } = {
  // Container Identification
  'container': 'container',
  'conteinner': 'container',
  
  // Armador/Shipping Line
  'armador': 'armador',
  
  // Dates and Times
  'data de operação': 'dataOperacao',
  'data operacao': 'dataOperacao',
  'data porto': 'dataPorto',
  'data de devolução': 'dataDevolucao',
  'data devolucao': 'dataDevolucao',
  
  // Financial/Time Metrics
  'demurrage': 'demurrage',
  'free time': 'freeTime',
  'freetime': 'freeTime',
  'dias restantes': 'diasRestantes',
  'diasrestantes': 'diasRestantes',
  
  // Logistics
  'placas': 'placas',
  'motorista': 'motorista',
  'origem': 'origem',
  'baixa patio sjp': 'baixaPatio',
  'baixa patio': 'baixaPatio',
  'container troca': 'containerTroca',
  'armador troca': 'armadorTroca',
  'depot de devolução': 'depotDevolucao',
  'depot devolucao': 'depotDevolucao',
  'status': 'status',
};

export const parseExcelFile = (file: File): Promise<Container[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Read data including header
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
        
        if (jsonData.length < 2) { // Need at least header + one data row
          return resolve([]);
        }

        // 1. Identify Header Row and create index map
        const headerRow = jsonData[0].map(h => String(h || '').toLowerCase().trim());
        const columnMap: { [key: number]: keyof Container } = {};

        headerRow.forEach((header, index) => {
          if (HEADER_MAP[header]) {
            columnMap[index] = HEADER_MAP[header];
          }
        });
        
        // Check if essential columns are missing
        if (!Object.values(columnMap).includes('container') || !Object.values(columnMap).includes('armador')) {
             console.warn("Colunas essenciais 'container' ou 'armador' não foram encontradas no cabeçalho.");
        }

        // 2. Process Data Rows (starting from index 1)
        const rows = jsonData.slice(1);
        
        const containers: Container[] = rows
          .filter(row => String(row[0] || '').trim() !== '') // Filter out empty rows based on the first column (assuming it's container)
          .map((row, index) => {
            const container: Partial<Container> = {
              id: `import-${Date.now()}-${index}`, // Generate unique ID
              files: [],
            };

            Object.keys(columnMap).forEach(colIndexStr => {
              const colIndex = parseInt(colIndexStr);
              const key = columnMap[colIndex];
              let value = row[colIndex];

              // Special handling for numeric fields and dates
              if (key === 'freeTime' || key === 'diasRestantes') {
                // Ensure value is treated as a number, defaulting to 0 if invalid
                container[key] = Number(value) || 0;
              } else if (key === 'dataOperacao' || key === 'dataPorto' || key === 'demurrage' || key === 'dataDevolucao') {
                // Convert Excel date serial to DD/MM/YY string
                container[key] = excelDateToJSDate(value);
              } else {
                // Treat all other fields as strings
                container[key] = String(value || '');
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