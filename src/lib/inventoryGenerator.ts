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

    if (containerStatusLower.includes("ok") || containerStatusLower.includes("devolvido") || c.dataSaidaSJP) {
      itemStatus = "Devolvido (RIC OK)";
    } else if (containerStatusLower.includes("aguardando") || containerStatusLower.includes("verificar")) {
      itemStatus = "Aguardando Devolução";
    } else {
      itemStatus = "Em Uso";
    }

    // 1. Rastrear Saída SJP (Baixa)
    if (c.dataSaidaSJP) {
      inventory.push({
        ...baseItem,
        itemType: 'Baixa Pátio',
        status: itemStatus,
        details: `Saída SJP registrada em: ${c.dataSaidaSJP}`,
      });
    }

    // 2. Rastrear Container de Troca (Se houver campos de troca no futuro, eles seriam adicionados aqui. Por enquanto, mantemos a estrutura simplificada.)
    // Como os campos de troca foram removidos da interface, esta lógica é removida.
    
    // 3. Rastrear Devolução (Usando status geral)
    if (itemStatus === "Devolvido (RIC OK)") {
        // Se o status for devolvido, criamos um item de rastreio de devolução
        inventory.push({
            ...baseItem,
            itemType: 'Devolução',
            status: itemStatus,
            details: `Status de devolução: ${c.status}`,
        });
    }
  });

  // Remove duplicatas se um container tiver múltiplos itens de rastreio (ex: Baixa e Devolução)
  // Para simplificar, vamos apenas retornar o que foi gerado, mas o Inventário agora foca mais em Saída/Status.
  return inventory;
};