export interface ContainerFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface Container {
  id: string;
  
  // Campos da Planilha (Ordem de Entrada)
  operador: string;
  motoristaEntrada: string;
  placa: string;
  dataEntrada: string;
  container: string;
  armador: string;
  tara: number;
  mgw: number;
  tipo: string;
  padrao: string;
  statusVazioCheio: string;
  dataPorto: string;
  freeTimeArmador: number;
  demurrage: string;
  prazoDias: number; // Novo campo para o prazo (dias restantes)
  clienteEntrada: string;
  transportadora: string;
  estoque: string;
  
  // Campos de Saída/Minuta/Rastreio
  transportadoraSaida: string;
  statusEntregaMinuta: string;
  statusMinuta: string;
  bookingAtrelado: string;
  lacre: string;
  clienteSaidaDestino: string;
  atrelado: string;
  operadorSaida: string;
  dataEstufagem: string;
  dataSaidaSJP: string;
  motoristaSaidaSJP: string;
  placaSaida: string;

  // Campos de compatibilidade/cálculo (mantidos)
  diasRestantes: number | string; // Mantido para compatibilidade com a lógica de alerta (será mapeado de prazoDias)
  status: string; // Mantido para compatibilidade com a lógica de status geral
  files?: ContainerFile[];
}

export interface ContainerStats {
  total: number;
  devolvidos: number;
  pendentes: number;
  vencidos: number;
  porArmador: Record<string, number>;
  porDepot: Record<string, number>;
}