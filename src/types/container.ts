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
  container: string;
  armador: string;
  dataOperacao: string;
  dataPorto: string;
  demurrage: string;
  freeTime: number;
  diasRestantes: number | string;
  placas: string;
  motorista: string;
  origem: string;
  baixaPatio?: string;
  containerTroca?: string;
  armadorTroca?: string;
  depotDevolucao: string;
  dataDevolucao: string;
  status: string;
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
