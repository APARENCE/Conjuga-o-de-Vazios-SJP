import { Container } from "@/types/container";
import { InventoryItem } from "@/types/inventory";
import { isContainerDevolvido } from "@/lib/containerUtils";

export const generateInventoryFromContainers = (containers: Container[]): InventoryItem[] => {
  const inventory: InventoryItem[] = [];

  containers.forEach(c => {
    const isDevolvido = isContainerDevolvido(c);
    
    // Determina o status do item de inventário com base na saída SJP
    let itemStatus: InventoryItem['status'];
    
    if (isDevolvido) {
        // Se o container foi devolvido (dataSaidaSJP preenchida OU status RIC OK)
        itemStatus = "Devolvido (RIC OK)";
    } else if (c.dataSaidaSJP) {
        // Se tem data de saída SJP, mas ainda não é considerado devolvido (RIC OK)
        itemStatus = "Aguardando Devolução";
    } else {
        // Se não tem data de saída SJP, está em estoque físico
        itemStatus = "Em Estoque";
    }
    
    const baseItem: Omit<InventoryItem, 'itemType' | 'details'> = {
      id: c.id,
      containerId: c.id,
      container: c.container,
      armador: c.armador,
      lastUpdated: new Date().toISOString(),
      status: itemStatus,
    };

    // --- Lógica de Geração de Itens de Inventário ---

    // 1. Rastreio de Baixa Pátio (Saída SJP)
    if (c.dataSaidaSJP) {
      inventory.push({
        ...baseItem,
        itemType: 'Baixa Pátio',
        details: `Saída SJP registrada em: ${c.dataSaidaSJP}`,
      });
    }

    // 2. Rastreio de Devolução (Status Geral)
    inventory.push({
        ...baseItem,
        itemType: 'Devolução',
        details: `Status geral do container: ${c.status || 'Em Operação'}`,
    });
    
    // 3. Rastreio de Troca
    if (c.bookingAtrelado) {
        inventory.push({
            ...baseItem,
            itemType: 'Troca',
            details: `Associado ao Booking: ${c.bookingAtrelado}`,
        });
    }
  });

  // Remove duplicatas baseadas no containerId e itemType (mantendo o último gerado)
  const uniqueInventoryMap = new Map<string, InventoryItem>();
  inventory.forEach(item => {
      const key = `${item.containerId}-${item.itemType}`;
      uniqueInventoryMap.set(key, item);
  });

  return Array.from(uniqueInventoryMap.values());
};