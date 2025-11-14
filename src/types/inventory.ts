export interface InventoryItem {
  id: string;
  containerId: string; // ID do container de origem
  container: string; // Número do container
  armador: string; // Armador do container
  itemType: 'Baixa Pátio' | 'Devolução' | 'Troca'; // Adicionando 'Troca' para resolver erros de comparação
  status: 'Em Uso' | 'Aguardando Devolução' | 'Devolvido (RIC OK)' | string;
  details: string; // Detalhes do item (ex: Container Troca, Baixa Pátio)
  lastUpdated: string;
  
  // Campos adicionados para compatibilidade com InventoryFormDialog
  name?: string;
  sku?: string;
  quantity?: number;
  location?: string;
  associatedContainer?: string;
}