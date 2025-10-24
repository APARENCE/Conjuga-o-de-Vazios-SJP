import * as XLSX from 'xlsx';
import { Container } from '@/types/container';

// Helper function to convert Excel date serial number to date string
const excelDateToJSDate = (serial: any): string => {
  if (!serial || serial === "-" || serial === "") return "";
  
  // If it's already a string date, return it
  if (typeof serial === "string") return serial;
  
  // Excel stores dates as numbers (days since 1900-01-01)
  if (typeof serial === "number") {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    
    const month = String(date_info.getMonth() + 1).padStart(2, '0');
    const day = String(date_info.getDate()).padStart(2, '0');
    const year = String(date_info.getFullYear()).slice(-2);
    
    return `${month}/${day}/${year}`;
  }
  
  return String(serial);
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        
        // Skip header row
        const rows = jsonData.slice(1) as any[][];
        
        const containers: Container[] = rows
          .filter(row => row[0]) // Filter out empty rows
          .map((row, index) => ({
            id: `${row[0]}-${index}`,
            container: row[0] || '',
            armador: row[1] || '',
            dataOperacao: excelDateToJSDate(row[2]),
            dataPorto: excelDateToJSDate(row[3]),
            demurrage: excelDateToJSDate(row[4]),
            freeTime: Number(row[5]) || 0,
            diasRestantes: row[6] || 0,
            placas: row[7] || '',
            motorista: row[8] || '',
            origem: row[9] || '',
            baixaPatio: row[10] || '',
            containerTroca: row[11] || '',
            armadorTroca: row[12] || '',
            depotDevolucao: row[13] || '',
            dataDevolucao: excelDateToJSDate(row[14]),
            status: row[15] || '',
          }));
        
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
