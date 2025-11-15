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
    motoristaEntrada: dbData.motorista_entrada || "",
    placa: dbData.placa || "",
    dataEntrada: dbData.data_entrada || "",
    container: dbData.container || "",
    armador: dbData.armador || "",
    tara: Number(dbData.tara) || 0,
    mgw: Number(dbData.mgw) || 0,
    tipo: dbData.tipo || "",
    padrao: dbData.padrao || "",
    statusVazioCheio: dbData.status_vazio_cheio || "",
    dataPorto: dbData.data_porto || "",
    freeTimeArmador: Number(dbData.free_time_armador) || 0,
    demurrage: dbData.demurrage || "",
    prazoDias: Number(dbData.prazo_dias) || 0,
    clienteEntrada: dbData.cliente_entrada || "",
    transportadora: dbData.transportadora || "",
    estoque: dbData.estoque || "",
    transportadoraSaida: dbData.transportadora_saida || "",
    statusEntregaMinuta: dbData.status_entrega_minuta || "",
    statusMinuta: dbData.status_minuta || "",
    bookingAtrelado: dbData.booking_atrelado || "",
    lacre: dbData.lacre || "",
    clienteSaidaDestino: dbData.cliente_saida_destino || "",
    atrelado: dbData.atrelado || "",
    operadorSaida: dbData.operador_saida || "",
    dataEstufagem: dbData.data_estufagem || "",
    dataSaidaSJP: dbData.data_saida_sjp || "",
    motoristaSaidaSJP: dbData.motorista_saida_sjp || "",
    placaSaida: dbData.placa_saida || "",
    depotDevolucao: dbData.depot_devolucao || "",
    diasRestantes: Number(dbData.dias_restantes) || 0,
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

  // 2. Mutation para adicionar um novo container (individual)
  const addContainerMutation = useMutation({
    mutationFn: async (containerData: Partial<Container>) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        throw new Error("Usuário não autenticado.");
      }
      
      const dataToInsert = {
        ...containerData,
        user_id: userId,
        container: containerData.container || "N/A",
        armador: containerData.armador || "N/A",
        dias_restantes: containerData.prazoDias || 0, 
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
      
      const dataToUpdate = {
        ...data,
        dias_restantes: data.prazoDias || data.diasRestantes,
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

  // 5. NOVA Mutation para adicionar múltiplos containers (importação)
  const addMultipleContainersMutation = useMutation({
    mutationFn: async (containersData: Partial<Container>[]) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        throw new Error("Usuário não autenticado.");
      }

      const validContainersData = containersData.filter(c => c.container && c.container.trim() !== "");

      if (validContainersData.length === 0) {
        throw new Error("Nenhum container válido encontrado no arquivo para importar.");
      }

      const dataToInsert = validContainersData.map(containerData => ({
        ...containerData,
        user_id: userId,
        container: containerData.container || "N/A",
        armador: containerData.armador || "N/A",
        dias_restantes: containerData.prazoDias || 0,
        id: undefined, // Garante que o Supabase gere o ID
      }));

      const { data, error } = await supabase
        .from("containers")
        .insert(dataToInsert)
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        throw new Error(`Falha ao inserir dados: ${error.message}. Verifique se as colunas do arquivo correspondem ao formato esperado.`);
      }
      return data.map(mapDbToContainer);
    },
    onSuccess: (newContainers) => {
      queryClient.invalidateQueries({ queryKey: CONTAINER_QUERY_KEY });
    },
    onError: (error) => {
      // O toast de erro já é tratado pelo hook useFileOperation
      console.error("Erro na mutação de múltiplos containers:", error);
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
    addMultipleContainers: addMultipleContainersMutation.mutateAsync, // Exportando a nova função
  };
}