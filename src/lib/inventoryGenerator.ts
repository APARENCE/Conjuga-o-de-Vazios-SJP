import { Container } from "@/types/container";
import { InventoryItem } from "@/types/inventory";

export const generateInventoryFromContainers = (containers: Container[]): InventoryItem[] => {
  const inventory: InventoryItem[] = [];

  containers.forEach(c => {
    const baseItem = {
      id: c.id, // Usamos o ID do container como ID do item de inventário
      containerId: c.id,
      container: c.container,
      armador: c.armador,
      lastUpdated: new Date().toISOString(),
    };

    // Determinar o status do item de inventário com base no status do container
    const containerStatusLower = String(c.status || '').toLowerCase();
    let itemStatus: InventoryItem['status'];

    if (containerStatusLower.includes("ok") || containerStatusLower.includes("devolvido")) {
      itemStatus = "Devolvido (RIC OK)";
    } else if (containerStatusLower.includes("aguardando") || containerStatusLower.includes("verificar")) {
      itemStatus = "Aguardando Devolução";
    } else {
      itemStatus = "Em Uso";
    }

    // 1. Rastrear Container de Troca
    if (c.containerTroca) {
      inventory.push({
        ...baseItem,
        itemType: 'Troca',
        status: itemStatus,
        details: `Container Troca: ${c.containerTroca} (Armador: ${c.armadorTroca || 'N/A'})`,
      });
    }

    // 2. Rastrear Baixa Pátio
    if (c.baixaPatio) {
      inventory.push({
        ...baseItem,
        itemType: 'Baixa Pátio',
        status: itemStatus,
        details: `Baixa Pátio SJP: ${c.baixaPatio}`,
      });
    }
    
    // 3. Rastrear Devolução (Se houver data de devolução e depot)
    if (c.dataDevolucao && c.depotDevolucao) {
        inventory.push({
            ...baseItem,
            itemType: 'Devolução',
            status: itemStatus,
            details: `Devolução em ${c.dataDevolucao} no Depot: ${c.depotDevolucao}`,
        });
    }
  });

  return inventory;
};