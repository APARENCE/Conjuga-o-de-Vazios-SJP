import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Container, ContainerFile } from "@/types/container";
import { toast } from "@/hooks/use-toast";

// Chave de cache para containers cheios
const FULL_CONTAINER_QUERY_KEY = ["fullContainers"];

// Função de mapeamento para garantir que os dados do DB correspondam à interface Container (snake_case -> camelCase)
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

// Função de mapeamento para garantir que os dados da aplicação correspondam ao DB (camelCase -> snake_case)
const mapContainerToDb = (containerData: Partial<Container>): any => {
  const dbData: { [key: string]: any } = {};
  
  if (containerData.operador !== undefined) dbData.operador = containerData.operador || "";
  if (containerData.motoristaEntrada !== undefined) dbData.motorista_entrada = containerData.motoristaEntrada || "";
  if (containerData.placa !== undefined) dbData.placa = containerData.placa || "";
  if (containerData.dataEntrada !== undefined) dbData.data_entrada = containerData.dataEntrada || "";
  if (containerData.container !== undefined) dbData.container = containerData.container || "";
  if (containerData.armador !== undefined) dbData.armador = containerData.armador || "";
  if (containerData.tara !== undefined) dbData.tara = containerData.tara;
  if (containerData.mgw !== undefined) dbData.mgw = containerData.mgw;
  if (containerData.tipo !== undefined) dbData.tipo = containerData.tipo || "";
  if (containerData.padrao !== undefined) dbData.padrao = containerData.padrao || "";
  if (containerData.statusVazioCheio !== undefined) dbData.status_vazio_cheio = containerData.statusVazioCheio || "";
  if (containerData.dataPorto !== undefined) dbData.data_porto = containerData.dataPorto || "";
  if (containerData.freeTimeArmador !== undefined) dbData.free_time_armador = containerData.freeTimeArmador;
  if (containerData.demurrage !== undefined) dbData.demurrage = containerData.demurrage || "";
  if (containerData.prazoDias !== undefined) dbData.prazo_dias = containerData.prazoDias;
  if (containerData.clienteEntrada !== undefined) dbData.cliente_entrada = containerData.clienteEntrada || "";
  if (containerData.transportadora !== undefined) dbData.transportadora = containerData.transportadora || "";
  if (containerData.estoque !== undefined) dbData.estoque = containerData.estoque || "";
  if (containerData.transportadoraSaida !== undefined) dbData.transportadora_saida = containerData.transportadoraSaida || "";
  if (containerData.statusEntregaMinuta !== undefined) dbData.status_entrega_minuta = containerData.statusEntregaMinuta || "";
  if (containerData.statusMinuta !== undefined) dbData.status_minuta = containerData.statusMinuta || "";
  if (containerData.bookingAtrelado !== undefined) dbData.booking_atrelado = containerData.bookingAtrelado || "";
  if (containerData.lacre !== undefined) dbData.lacre = containerData.lacre || "";
  if (containerData.clienteSaidaDestino !== undefined) dbData.cliente_saida_destino = containerData.clienteSaidaDestino || "";
  if (containerData.atrelado !== undefined) dbData.atrelado = containerData.atrelado || "";
  if (containerData.operadorSaida !== undefined) dbData.operador_saida = containerData.operadorSaida || "";
  if (containerData.dataEstufagem !== undefined) dbData.data_estufagem = containerData.dataEstufagem || "";
  if (containerData.dataSaidaSJP !== undefined) dbData.data_saida_sjp = containerData.dataSaidaSJP || "";
  if (containerData.motoristaSaidaSJP !== undefined) dbData.motorista_saida_sjp = containerData.motoristaSaidaSJP || "";
  if (containerData.placaSaida !== undefined) dbData.placa_saida = containerData.placaSaida || "";
  if (containerData.depotDevolucao !== undefined) dbData.depot_devolucao = containerData.depotDevolucao || "";
  if (containerData.diasRestantes !== undefined) dbData.dias_restantes = containerData.diasRestantes;
  if (containerData.status !== undefined) dbData.status = containerData.status || "";
  if (containerData.files !== undefined) dbData.files = containerData.files;

  return dbData;
};

// Função para buscar todos os containers cheios do usuário logado
const fetchFullContainers = async (): Promise<Container[]> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("containers_cheios") // Mudança aqui
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapDbToContainer);
};

export function useFullContainers() {
  const queryClient = useQueryClient();

  const containersQuery = useQuery({
    queryKey: FULL_CONTAINER_QUERY_KEY,
    queryFn: fetchFullContainers,
    staleTime: 1000 * 60 * 5,
  });

  const addContainerMutation = useMutation({
    mutationFn: async (containerData: Partial<Container>) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error("Usuário não autenticado.");

      const dataToInsert = mapContainerToDb({
        ...containerData,
        diasRestantes: containerData.prazoDias || 0,
      });
      dataToInsert.user_id = userId;

      const { data, error } = await supabase.from("containers_cheios").insert([dataToInsert]).select().single(); // Mudança aqui
      if (error) throw new Error(error.message);
      return mapDbToContainer(data);
    },
    onSuccess: (newContainer) => {
      queryClient.invalidateQueries({ queryKey: FULL_CONTAINER_QUERY_KEY });
      toast({
        title: "Container Cheio adicionado!",
        description: `O container ${newContainer.container} foi adicionado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar container cheio",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateContainerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Container> }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error("Usuário não autenticado.");

      const dataToUpdate = mapContainerToDb({
        ...data,
        diasRestantes: data.prazoDias !== undefined ? data.prazoDias : data.diasRestantes,
      });

      const { data: updatedData, error } = await supabase.from("containers_cheios").update(dataToUpdate).eq("id", id).eq("user_id", userId).select().single(); // Mudança aqui
      if (error) throw new Error(error.message);
      return mapDbToContainer(updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FULL_CONTAINER_QUERY_KEY });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar container cheio",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteContainerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error("Usuário não autenticado.");

      const { error } = await supabase.from("containers_cheios").delete().eq("id", id).eq("user_id", userId); // Mudança aqui
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FULL_CONTAINER_QUERY_KEY });
      toast({
        title: "Container Cheio excluído!",
        description: "O container foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir container cheio",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addMultipleContainersMutation = useMutation({
    mutationFn: async (containersData: Partial<Container>[]) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error("Usuário não autenticado.");

      const validContainersData = containersData.filter(c => c.container && c.container.trim() !== "");
      if (validContainersData.length === 0) {
        throw new Error("Nenhum container válido encontrado no arquivo para importar.");
      }

      const dataToInsert = validContainersData.map(containerData => {
        const mappedData = mapContainerToDb({
            ...containerData,
            diasRestantes: containerData.prazoDias || 0,
        });
        mappedData.user_id = userId;
        return mappedData;
      });

      const { data, error } = await supabase.from("containers_cheios").insert(dataToInsert).select(); // Mudança aqui
      if (error) {
        console.error("Supabase insert error:", error);
        throw new Error(`Falha ao inserir dados: ${error.message}. Verifique se as colunas do arquivo correspondem ao formato esperado.`);
      }
      return data.map(mapDbToContainer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FULL_CONTAINER_QUERY_KEY });
    },
    onError: (error) => {
      console.error("Erro na mutação de múltiplos containers cheios:", error);
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
    addMultipleContainers: addMultipleContainersMutation.mutateAsync,
  };
}