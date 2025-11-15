import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Container, ContainerFile } from "@/types/container";
import { toast } from "@/hooks/use-toast";

// Chave de cache para containers
const CONTAINER_QUERY_KEY = ["containers"];

// Função de mapeamento para garantir que os dados do DB correspondam à interface Container
const mapDbToContainer = (dbData: any): Container => ({
    id: dbData.id,
    operador: dbData.operador || "",
    motoristaEntrada: dbData.motoristaEntrada || "",
    placa: dbData.placa || "",
    dataEntrada: dbData.dataEntrada || "",
    container: dbData.container || "",
    armador: dbData.armador || "",
    tara: Number(dbData.tara) || 0,
    mgw: Number(dbData.mgw) || 0,
    tipo: dbData.tipo || "",
    padrao: dbData.padrao || "",
    statusVazioCheio: dbData.statusVazioCheio || "",
    dataPorto: dbData.dataPorto || "",
    freeTimeArmador: Number(dbData.freeTimeArmador) || 0,
    demurrage: dbData.demurrage || "",
    prazoDias: Number(dbData.prazoDias) || 0,
    clienteEntrada: dbData.clienteEntrada || "",
    transportadora: dbData.transportadora || "",
    estoque: dbData.estoque || "",
    transportadoraSaida: dbData.transportadoraSaida || "",
    statusEntregaMinuta: dbData.statusEntregaMinuta || "",
    statusMinuta: dbData.statusMinuta || "",
    bookingAtrelado: dbData.bookingAtrelado || "",
    lacre: dbData.lacre || "",
    clienteSaidaDestino: dbData.clienteSaidaDestino || "",
    atrelado: dbData.atrelado || "",
    operadorSaida: dbData.operadorSaida || "",
    dataEstufagem: dbData.dataEstufagem || "",
    dataSaidaSJP: dbData.dataSaidaSJP || "",
    motoristaSaidaSJP: dbData.motoristaSaidaSJP || "",
    placaSaida: dbData.placaSaida || "",
    depotDevolucao: dbData.depotDevolucao || "",
    diasRestantes: Number(dbData.diasRestantes) || 0,
    status: dbData.status || "",
    files: (dbData.files as ContainerFile[]) || [],
});

// Função para buscar todos os containers do usuário logado
const fetchContainers = async (): Promise<Container[]> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  if (!userId) {
    // Se não houver usuário logado, retorna um array vazio
    return [];
  }

  const { data, error } = await supabase
    .from("containers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapDbToContainer);
};

export function useContainers() {
  const queryClient = useQueryClient();

  // 1. Query para buscar todos os containers
  const containersQuery = useQuery({
    queryKey: CONTAINER_QUERY_KEY,
    queryFn: fetchContainers,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // 2. Mutation para adicionar um novo container
  const addContainerMutation = useMutation({
    mutationFn: async (containerData: Partial<Container>) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        throw new Error("Usuário não autenticado.");
      }
      
      // Mapeia os dados para o formato do DB, garantindo que user_id e campos obrigatórios estejam presentes
      const dataToInsert = {
        ...containerData,
        user_id: userId,
        container: containerData.container || "N/A",
        armador: containerData.armador || "N/A",
        // Garante que diasRestantes seja mapeado de prazoDias
        diasRestantes: containerData.prazoDias || 0, 
      };

      const { data, error } = await supabase
        .from("containers")
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return mapDbToContainer(data);
    },
    onSuccess: (newContainer) => {
      queryClient.invalidateQueries({ queryKey: CONTAINER_QUERY_KEY });
      toast({
        title: "Container adicionado!",
        description: `O container ${newContainer.container} foi adicionado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar container",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 3. Mutation para atualizar um container existente
  const updateContainerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Container> }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        throw new Error("Usuário não autenticado.");
      }
      
      // Garante que diasRestantes seja mapeado de prazoDias
      const dataToUpdate = {
        ...data,
        diasRestantes: data.prazoDias || data.diasRestantes,
      };

      const { data: updatedData, error } = await supabase
        .from("containers")
        .update(dataToUpdate)
        .eq("id", id)
        .eq("user_id", userId) // RLS check
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return mapDbToContainer(updatedData);
    },
    onSuccess: (updatedContainer) => {
      queryClient.invalidateQueries({ queryKey: CONTAINER_QUERY_KEY });
      // O toast de sucesso será gerenciado pelo componente chamador (Portaria ou Containers)
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar container",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 4. Mutation para deletar um container
  const deleteContainerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        throw new Error("Usuário não autenticado.");
      }

      const { error } = await supabase
        .from("containers")
        .delete()
        .eq("id", id)
        .eq("user_id", userId); // RLS check

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTAINER_QUERY_KEY });
      toast({
        title: "Container excluído!",
        description: "O container foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir container",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    containers: containersQuery.data || [],
    isLoading: containersQuery.isLoading,
    isFetching: containersQuery.isFetching,
    error: containersQuery.error,
    addContainer: addContainerMutation.mutateAsync,
    updateContainer: updateContainerMutation.mutateAsync,
    deleteContainer: deleteContainerMutation.mutateAsync,
  };
}