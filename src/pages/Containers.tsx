import { useState } from "react";
import { Container, ContainerFile } from "@/types/container";
import { ContainerTable } from "@/components/ContainerTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
// ContainerFormDialog não é mais necessário aqui

interface ContainersPageProps {
  containers: Container[];
  onContainerUpdate: (containerId: string, files: ContainerFile[]) => void;
  onContainerAdd: (container: Partial<Container>) => void;
  onContainerEdit: (id: string, container: Partial<Container>) => void;
  onContainerDelete: (id: string) => void;
}

export default function Containers({ 
  containers, 
  onContainerUpdate, 
  onContainerAdd, 
  onContainerEdit, 
  onContainerDelete 
}: ContainersPageProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContainers = containers.filter(c => {
    const search = searchTerm.toLowerCase().trim();
    
    // Se o termo de pesquisa estiver vazio, retorna todos os containers
    if (!search) return true;

    // Foco na busca: Apenas filtra pelo campo 'container' (coluna A da planilha)
    // Usamos correspondência EXATA (===) para mostrar apenas o número específico pesquisado.
    const containerNumber = String(c.container || '').toLowerCase();

    return containerNumber === search;
  });
  
  // Log para depuração
  console.log(`Termo de pesquisa: "${searchTerm}", Containers filtrados: ${filteredContainers.length}`);


  const stats = {
    total: containers.length,
    devolvidos: containers.filter(c => {
      const status = String(c.status || '').toLowerCase();
      return status.includes("ok") || status.includes("devolvido");
    }).length,
    pendentes: containers.filter(c => {
      const status = String(c.status || '').toLowerCase();
      return status.includes("aguardando") || status.includes("verificar");
    }).length,
    vencidos: containers.filter(c => {
      const dias = typeof c.diasRestantes === 'number' ? c.diasRestantes : 0;
      return dias === 0;
    }).length,
  };

  return (
    <div className="flex flex-col h-full space-y-6"> {/* Alterado para flex-col h-full */}
      {/* Título */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Containers</h1>
          <p className="text-muted-foreground mt-1">
            Controle de entrada e saída de containers CAS
          </p>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar pelo número exato do container (Coluna A)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 shrink-0">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Containers
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Devolvidos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.devolvidos}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.pendentes}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-danger">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencidos
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.vencidos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Containers - Ocupa o espaço restante */}
      <div className="flex-1 min-h-0"> {/* Adicionado flex-1 e min-h-0 para forçar a tabela a usar o espaço restante */}
        <ContainerTable 
          containers={filteredContainers} 
          onContainerUpdate={onContainerUpdate}
          onContainerEdit={onContainerEdit}
          onContainerDelete={onContainerDelete}
        />
      </div>
    </div>
  );
}