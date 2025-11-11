import * as XLSX from 'xlsx';
import { Container } from '@/types/container';

// Helper function to convert Excel date serial number or string date to DD/MM/YYYY format
const excelDateToJSDate = (serial: any): string => {
  if (!serial || serial === "-" || serial === "") return "";
  
  let date: Date | null = null;

  if (typeof serial === "number") {
    // Excel stores dates as numbers (days since 1900-01-01)
    // Usamos 1900 como base, mas ajustamos para o fuso horário UTC para evitar desvios de 1 dia.
    const utc_days = Math.floor(serial - 25569);
    date = new Date(utc_days * 86400 * 1000);
    
    // Se a data for inválida após a conversão, tentamos tratar como string
    if (isNaN(date.getTime())) {
        date = null;
    }
  } 
  
  if (typeof serial === "string") {
    // Tenta parsear strings comuns de data (DD/MM/YYYY, YYYY-MM-DD, etc.)
    
    // Formato Brasileiro (DD/MM/YYYY)
    const brMatch = serial.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (brMatch) {
        // Cria a data no formato YYYY-MM-DD para evitar problemas de fuso horário
        date = new Date(`${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`);
    } else {
        // Tenta parsear como data ISO ou US (fallback)
        date = new Date(serial);
    }

    // Se a data for inválida, retorna a string original
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
// Ordem e nomes baseados na planilha:
const HEADER_MAP: { [key: string]: keyof Container } = {
  'conteiner': 'container',
  'armador': 'armador',
  'data de operação': 'dataOperacao',
  'data porto': 'dataPorto',
  'demurrage': 'demurrage',
  'free time': 'freeTime',
  'dias restantes': 'diasRestantes',
  'placas': 'placas',
  'motorista': 'motorista',
  'origem': 'origem',
  'depot de devolução': 'depotDevolucao',
  'data de devolução': 'dataDevolucao',
  'container troca': 'containerTroca',
  'armador troca': 'armadorTroca',
  'baixa pátio sjp': 'baixaPatio',
  'status': 'status',
  
  // Variações comuns para robustez
  'nº container': 'container',
  'data operacao': 'dataOperacao',
  'data devolução': 'dataDevolucao',
  'depot devolucao': 'depotDevolucao',
  'baixa patio sjp': 'baixaPatio',
  'freetime': 'freeTime',
  'diasrestantes': 'diasRestantes',
};

export const parseExcelFile = (file: File): Promise<Container[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Usamos raw: false para que o XLSX tente formatar datas e números
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true, raw: false });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Usamos header: 1 para obter a primeira linha como cabeçalho
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
              } else if (['dataOperacao', 'dataPorto', 'dataDevolucao', 'baixaPatio'].includes(key)) {
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
      // Ordem exata da planilha
      'CONTEINER': c.container,
      'ARMADOR': c.armador,
      'DATA DE OPERAÇÃO': c.dataOperacao,
      'DATA PORTO': c.dataPorto,
      'DEMURRAGE': c.demurrage,
      'FREE TIME': c.freeTime,
      'DIAS RESTANTES': c.diasRestantes,
      'PLACAS': c.placas,
      'MOTORISTA': c.motorista,
      'ORIGEM': c.origem,
      'DEPOT DE DEVOLUÇÃO': c.depotDevolucao,
      'DATA DE DEVOLUÇÃO': c.dataDevolucao,
      'CONTAINER TROCA': c.containerTroca,
      'ARMADOR TROCA': c.armadorTroca,
      'BAIXA PÁTIO SJP': c.baixaPatio,
      'STATUS': c.status,
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Containers');
  XLSX.writeFile(workbook, `containers_${new Date().toISOString().split('T')[0]}.xlsx`);
};