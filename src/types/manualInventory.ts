import { InventoryItem } from "./inventory";

// Interface para itens de inventário criados manualmente (não derivados de containers)
export interface ManualInventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  location: string;
  status: InventoryItem['status'];
  associatedContainer?: string;
}