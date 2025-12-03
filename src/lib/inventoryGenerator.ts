import { Container } from "@/types/container";
import { InventoryItem } from "@/types/inventory";
import { isContainerDevolvido } from "@/lib/containerUtils";

export const generateInventoryFromContainers = (containers: Container[]): InventoryItem[] => {
  const inventory: InventoryItem[] = [];

  containers.forEach(c => {
    const isDevolvido = isContainerDevolvido(c);
    
    // Se o container foi devolvido, ele não deve gerar itens de estoque ATIVO.
    // No entanto, ele deve gerar itens de rastreio CONCLUÍDOS para fins de histórico/análise.
    
    const baseItem: Omit<InventoryItem, 'itemType' | 'details'> = {
      id: c.id,
      containerId: c.id,
      container: c.container,
      armador: c.armador,
      lastUpdated: new Date().toISOString(),
      status: isDevolvido ? "Devolvido (RIC OK)" : "Em Uso", // Status base
    };

    // --- Lógica de Geração de Itens de Inventário ---

    // 1. Rastreio de Baixa Pátio (Saída SJP)
    if (c.dataSaidaSJP) {
      inventory.push({
        ...baseItem,
        itemType: 'Baixa Pátio',
        status: isDevolvido ? "Devolvido (RIC OK)" : "Aguardando Devolução", // Se tem data de saída, mas ainda não foi marcado como devolvido, está aguardando.
        details: `Saída SJP registrada em: ${c.dataSaidaSJP}`,
      });
    }

    // 2. Rastreio de Devolução (Status Geral)
    // Este item rastreia o ciclo de devolução do container.
    inventory.push({
        ...baseItem,
        itemType: 'Devolução',
        status: isDevolvido ? "Devolvido (RIC OK)" : "Em Uso",
        details: `Status geral do container: ${c.status || 'Em Operação'}`,
    });
    
    // 3. Rastreio de Troca (Exemplo: Se o container tem um booking atrelado, pode ser uma troca)
    // Esta é uma lógica de exemplo, mas é mantida para consistência.
    if (c.bookingAtrelado) {
        inventory.push({
            ...baseItem,
            itemType: 'Troca',
            status: isDevolvido ? "Devolvido (RIC OK)" : "Em Uso",
            details: `Associado ao Booking: ${c.bookingAtrelado}`,
        });
    }
  });

  // Para a contagem de ESTOQUE ATIVO, o filtro deve ser aplicado no componente Inventario.tsx.
  // Aqui, geramos todos os itens de rastreio, e o componente de visualização filtra por status.
  
  // Remove duplicatas baseadas no containerId e itemType (mantendo o último gerado)
  const uniqueInventoryMap = new Map<string, InventoryItem>();
  inventory.forEach(item => {
      // Chave única: ID do Container + Tipo de Item
      const key = `${item.containerId}-${item.itemType}`;
      uniqueInventoryMap.set(key, item);
  });

  return Array.from(uniqueInventoryMap.values());
};