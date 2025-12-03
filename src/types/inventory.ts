export interface InventoryItem {
  id: string;
  containerId: string; // ID do container de origem
  container: string; // Número do container
  armador: string; // Armador do container
  itemType: 'Baixa Pátio' | 'Devolução' | 'Troca'; // Adicionando 'Troca' para resolver erros de comparação
  status: 'Em Estoque' | 'Aguardando Devolução' | 'Devolvido (RIC OK)' | string; // Status atualizado
  details: string; // Detalhes do item (ex: Container Troca, Baixa Pátio)
  lastUpdated: string;
}