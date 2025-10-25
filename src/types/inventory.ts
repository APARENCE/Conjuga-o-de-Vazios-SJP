export interface InventoryItem {
  id: string;
  name: string;
  sku: string; // Stock Keeping Unit
  quantity: number;
  location: string;
  lastUpdated: string;
  status: 'Em Estoque' | 'Aguardando Devolução' | 'RIC OK' | string;
  associatedContainer?: string; // Novo campo para ligar ao container
}