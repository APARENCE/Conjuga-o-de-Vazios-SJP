export interface InventoryItem {
  id: string;
  containerId: string; // ID do container de origem
  container: string; // Número do container
  armador: string; // Armador do container
  itemType: 'Troca' | 'Baixa Pátio' | 'Devolução'; // Tipo de item de inventário gerado
  status: 'Em Uso' | 'Aguardando Devolução' | 'Devolvido (RIC OK)' | string;
  details: string; // Detalhes do item (ex: Container Troca, Baixa Pátio)
  lastUpdated: string;
}