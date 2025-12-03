import {
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Search,
  Grid,
  List,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContainerFormDialog } from "@/components/ContainerFormDialog";
import { VencimentoAlert } from "@/components/VencimentoAlert";
import { motion } from "framer-motion";
import { Container } from "@/types/container";

interface ContainerHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  armadorFilter: string;
  setArmadorFilter: (armador: string) => void;
  viewMode: "table" | "cards";
  setViewMode: (mode: "table" | "cards") => void;
  allArmadores: string[];
  containers: Container[];
  filteredContainersCount: number;
  totalContainersCount: number;
  stats: {
    total: number;
    devolvidos: number;
    pendentes: number;
    vencidos: number;
    armadoresFiltrados: number;
  };
  onContainerAdd: (container: Partial<Container>) => Promise<void>;
  // Novos props para título dinâmico
  title: string;
  subtitle: string;
}

const StatCard = ({ title, value, subtitle, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, delay }}
  >
    <Card className={`border-l-4 ${color} hover:shadow-md transition-shadow`}>
      <CardHeader className="flex flex-row items-center justify-between pb-0.5 p-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-3 w-3 ${color.replace('border-l-', 'text-')}`} />
      </CardHeader>
      <CardContent className="p-1 pt-0">
        <div className="text-sm font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  </motion.div>
);

export function ContainerHeader({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  armadorFilter,
  setArmadorFilter,
  viewMode,
  setViewMode,
  allArmadores,
  containers,
  filteredContainersCount,
  totalContainersCount,
  stats,
  onContainerAdd,
  title,
  subtitle,
}: ContainerHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-background pb-2 border-b border-border/50 shadow-sm -mx-4 px-4">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {subtitle}
            </p>
          </div>

          {/* Barra de ações e filtros */}
          <div className="flex flex-col sm:flex-row gap-1">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Pesquisar container, armador, motorista, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 text-xs h-7"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-[140px] h-7 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="devolvidos">Devolvidos</SelectItem>
                <SelectItem value="pendentes">Pendentes</SelectItem>
                <SelectItem value="vencidos">Vencidos (0 dias)</SelectItem>
                <SelectItem value="proximos">Próximos (1-3 dias)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={armadorFilter} onValueChange={setArmadorFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-7 text-xs">
                <SelectValue placeholder="Armador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Armadores</SelectItem>
                {allArmadores.map((armador) => (
                  <SelectItem key={armador} value={armador}>
                    {armador}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-7 px-2"
              >
                <List className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-7 px-2"
              >
                <Grid className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Alerta de Vencimento */}
        <VencimentoAlert
          containers={containers}
          onFilterChange={setStatusFilter}
          currentFilter={statusFilter}
        />

        {/* KPIs */}
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total"
            value={stats.total}
            subtitle={`${stats.armadoresFiltrados} armadores`}
            icon={Package}
            color="border-l-primary"
            delay={0.1}
          />
          <StatCard
            title="Devolvidos"
            value={stats.devolvidos}
            subtitle={`${stats.total > 0 ? ((stats.devolvidos / stats.total) * 100).toFixed(1) : 0}%`}
            icon={CheckCircle}
            color="border-l-success"
            delay={0.2}
          />
          <StatCard
            title="Pendentes"
            value={stats.pendentes}
            subtitle={`${stats.total > 0 ? ((stats.pendentes / stats.total) * 100).toFixed(1) : 0}%`}
            icon={TrendingUp}
            color="border-l-warning"
            delay={0.3}
          />
          <StatCard
            title="Vencidos"
            value={stats.vencidos}
            subtitle={`${stats.total > 0 ? ((stats.vencidos / stats.total) * 100).toFixed(1) : 0}%`}
            icon={AlertCircle}
            color="border-l-danger"
            delay={0.4}
          />
        </div>

        {/* Resultados da busca */}
        <div className="flex justify-between items-center pt-1">
          <p className="text-xs text-muted-foreground">
            {filteredContainersCount} de {totalContainersCount} containers
          </p>
          <ContainerFormDialog
            onSave={onContainerAdd}
            trigger={
              <Button size="sm" className="gap-1 h-7 px-2 text-xs">
                <Package className="h-3 w-3" />
                Novo Container
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}