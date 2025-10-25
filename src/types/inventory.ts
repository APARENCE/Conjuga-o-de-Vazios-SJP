export interface InventoryItem {
  id: string;
  name: string;
  sku: string; // Stock Keeping Unit
  quantity: number;
  location: string;
  lastUpdated: string;
}