import { Container } from "@/types/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useMemo, useState } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { TrendingUp, TrendingDown, Package, AlertTriangle, CheckCircle2, Clock, Filter, Download, BarChart3, PieChartIcon, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AnalisePageProps {
  containers: Container[];
}

export default function Analise({ containers }: AnalisePageProps) {
  const [selectedChart, setSelectedChart] = useState<"all" | "armador" | "status" | "dias" | "depot">("all");
  const [timeRange, setTimeRange] = useState<"all" | "30" | "60" | "90">("all");
  const isMobile = useIsMobile();

  // Filtrar containers por período
  const filteredContainers = useMemo(() => {
    if (timeRange === "all") return containers;
    
    const daysAgo = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    return containers.filter(c => {
      // Converte DD/MM/YYYY para Date
      const dataOpParts = c.dataOperacao?.split('/');
      if (!dataOpParts || dataOpParts.length !== 3) return false;
      
      // Cria a data no formato YYYY-MM-DD para evitar problemas de fuso horário
      const dataOp = new Date(`${dataOpParts[2]}-${dataOpParts[1]}-${dataOpParts[0]}`);
      
      return dataOp && dataOp >= cutoffDate;
    });
  }, [containers, timeRange]);

  const armadorData = useMemo(() => {
    const grouped = filteredContainers.reduce((acc, container) => {
      const armador = container.armador || "Não especificado";
      acc[armador] = (acc[armador] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, isMobile ? 6 : 10); // Aumenta para 6 em mobile para melhor visualização
  }, [filteredContainers, isMobile]);

  const depotData = useMemo(() => {
    const grouped = filteredContainers.reduce((acc, container) => {
      const depot = container.depotDevolucao || "Não especificado";
      if (depot && depot !== "-") {
        acc[depot] = (acc[depot] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, isMobile ? 6 : 8); // Aumenta para 6 em mobile
  }, [filteredContainers, isMobile]);

  const statusData = useMemo(() => {
    const devolvidos = filteredContainers.filter(c => {
      const status = String(c.status || '').toLowerCase();
      return status.includes("ok") || status.includes("devolvido");
    }).length;
    const pendentes = filteredContainers.filter(c => {
      const status = String(c.status || '').toLowerCase();
      return status.includes("aguardando") || status.includes("verificar");
    }).length;
    const outros = filteredContainers.length - devolvidos - pendentes;

    return [
      { name: "Devolvidos", value: devolvidos, color: "hsl(var(--success))" },
      { name: "Pendentes", value: pendentes, color: "hsl(var(--warning))" },
      { name: "Outros", value: outros, color: "hsl(var(--muted))" },
    ].filter(item => item.value > 0);
  }, [filteredContainers]);

  const diasRestantesData = useMemo(() => {
    const ranges = {
      "Vencido (0)": 0,
      "1-3 dias": 0,
      "4-7 dias": 0,
      "8-14 dias": 0,
      "15+ dias": 0,
    };

    filteredContainers.forEach(c => {
      const dias = typeof c.diasRestantes === 'number' ? c.diasRestantes : 0;
      if (dias === 0) ranges["Vencido (0)"]++;
      else if (dias <= 3) ranges["1-3 dias"]++;
      else if (dias <= 7) ranges["4-7 dias"]++;
      else if (dias <= 14) ranges["8-14 dias"]++;
      else ranges["15+ dias"]++;
    });

    return Object.entries(ranges).map(([name, value]) => ({ name, value }));
  }, [filteredContainers]);

  // Timeline de operações (novidade)
  const timelineData = useMemo(() => {
    const grouped = filteredContainers.reduce((acc, container) => {
      if (!container.dataOperacao) return acc;
      
      // Converte DD/MM/YYYY para Date
      const parts = container.dataOperacao.split('/');
      if (parts.length !== 3) return acc;
      
      const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthLabel, entradas: 0, devolucoes: 0, key: monthKey };
      }
      
      acc[monthKey].entradas++;
      if (String(container.status || '').toLowerCase().includes("devolvido")) {
        acc[monthKey].devolucoes++;
      }
      
      return acc;
    }, {} as Record<string, { month: string; entradas: number; devolucoes: number; key: string }>);

    // Ordena por chave (YYYY-MM) e pega os últimos 6
    return Object.values(grouped)
        .sort((a, b) => a.key.localeCompare(b.key))
        .slice(-6); 
  }, [filteredContainers]);

  const stats = useMemo(() => {
    const devolvidos = statusData.find(s => s.name === "Devolvidos")?.value || 0;
    const pendentes = statusData.find(s => s.name === "Pendentes")?.value || 0;
    const vencidos = diasRestantesData.find(d => d.name === "Vencido (0)")?.value || 0;

    return {
      total: filteredContainers.length,
      devolvidos,
      pendentes,
      vencidos,
      taxaDevolucao: filteredContainers.length > 0 ? ((devolvidos / filteredContainers.length) * 100).toFixed(1) : "0",
    };
  }, [filteredContainers, statusData, diasRestantesData]);

  const chartConfig = {
    devolvidos: { label: "Devolvidos", color: "hsl(var(--success))" },
    pendentes: { label: "Pendentes", color: "hsl(var(--warning))" },
    outros: { label: "Outros", color: "hsl(var(--muted))" },
    vencido: { label: "Vencido", color: "hsl(var(--destructive))" },
    entradas: { label: "Entradas", color: "hsl(var(--primary))" },
    devolucoes: { label: "Devoluções", color: "hsl(var(--success))" },
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, delay }: any) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className={`border-l-4 border-l-${color} hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 p-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={`h-3 w-3 text-${color}`} />
        </CardHeader>
        <CardContent className="p-1 pt-0">
          <div className="text-sm font-bold text-foreground">{value}</div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  const ChartCard = ({ title, description, children, icon: Icon, className }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );

  // Altura dinâmica para gráficos
  const chartHeight = isMobile ? 250 : 300;
  const barChartMargin = isMobile ? { top: 10, right: 5, bottom: 60, left: 5 } : { top: 20, right: 20, bottom: 40, left: 20 };
  const pieChartOuterRadius = isMobile ? 70 : 90;

  return (
    <div className="space-y-4 pb-8 px-4"> {/* Adicionando padding horizontal aqui */}
      {/* Header Fixo (Título, Filtros) */}
      <div className="sticky top-0 z-40 bg-background pb-2 border-b border-border/50 shadow-sm -mx-4 px-4"> {/* Ajustando margem negativa para cobrir o padding do container */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Análise de Dados</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Visualização e estatísticas detalhadas dos containers CAS
              </p>
            </div>
            
            {/* Controles */}
            <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-full sm:w-[140px] h-7 text-xs">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="60">Últimos 60 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" className="gap-1 h-7 px-2 text-xs">
                <Download className="h-3 w-3" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Filtros rápidos para mobile */}
          {isMobile && (
            <div className="flex gap-1 overflow-x-auto pb-1">
              <Button
                variant={selectedChart === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChart("all")}
                className="whitespace-nowrap h-7 text-xs px-2"
              >
                <Activity className="h-3 w-3 mr-1" />
                Todos
              </Button>
              <Button
                variant={selectedChart === "status" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChart("status")}
                className="whitespace-nowrap h-7 text-xs px-2"
              >
                <PieChartIcon className="h-3 w-3 mr-1" />
                Status
              </Button>
              <Button
                variant={selectedChart === "armador" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChart("armador")}
                className="whitespace-nowrap h-7 text-xs px-2"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Armador
              </Button>
              <Button
                variant={selectedChart === "dias" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChart("dias")}
                className="whitespace-nowrap h-7 text-xs px-2"
              >
                <Clock className="h-3 w-3 mr-1" />
                Prazos
              </Button>
              <Button
                variant={selectedChart === "depot" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChart("depot")}
                className="whitespace-nowrap h-7 text-xs px-2"
              >
                <Package className="h-3 w-3 mr-1" />
                Depot
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards - Responsivo */}
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total"
          value={stats.total}
          subtitle={`${armadorData.length} armadores`}
          icon={Package}
          color="primary"
          delay={0.1}
        />
        <StatCard
          title="Devolvidos"
          value={stats.devolvidos}
          subtitle={`${stats.taxaDevolucao}% do total`}
          icon={CheckCircle2}
          color="success"
          delay={0.2}
        />
        <StatCard
          title="Pendentes"
          value={stats.pendentes}
          subtitle={`${filteredContainers.length > 0 ? ((stats.pendentes / filteredContainers.length) * 100).toFixed(1) : 0}% do total`}
          icon={Clock}
          color="warning"
          delay={0.3}
        />
        <StatCard
          title="Vencidos"
          value={stats.vencidos}
          subtitle={`${filteredContainers.length > 0 ? ((stats.vencidos / filteredContainers.length) * 100).toFixed(1) : 0}% do total`}
          icon={AlertTriangle}
          color="danger"
          delay={0.4}
        />
        <StatCard
          title="Taxa Devolução"
          value={`${stats.taxaDevolucao}%`}
          subtitle="Eficiência operacional"
          icon={TrendingUp}
          color="success"
          delay={0.5}
        />
      </div>

      {/* Charts Grid - Responsivo e Dinâmico */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedChart}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn("grid gap-4", isMobile || selectedChart !== "all" ? "grid-cols-1" : "lg:grid-cols-2")}
        >
          
          {/* Containers por Armador */}
          {(selectedChart === "all" || selectedChart === "armador") && (
            <ChartCard
              title="Containers por Armador"
              description={`Top ${armadorData.length} armadores no período selecionado`}
              icon={BarChart3}
              className={cn(selectedChart === "armador" && "lg:col-span-2")}
            >
              <ChartContainer config={chartConfig} className={`h-[${chartHeight}px]`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={armadorData} margin={barChartMargin}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      angle={isMobile ? -45 : -30}
                      textAnchor="end"
                      height={isMobile ? 70 : 60}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 9 : 12 }}
                      interval={0} // Garante que todos os rótulos sejam exibidos
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </ChartCard>
          )}

          {/* Distribuição por Status */}
          {(selectedChart === "all" || selectedChart === "status") && (
            <ChartCard
              title="Distribuição por Status"
              description="Proporção de containers por status"
              icon={PieChartIcon}
            >
              <ChartContainer config={chartConfig} className={`h-[${chartHeight}px]`}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => isMobile ? `${(percent * 100).toFixed(0)}%` : `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={pieChartOuterRadius}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    {!isMobile && <Legend layout="vertical" verticalAlign="middle" align="right" />}
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </ChartCard>
          )}

          {/* Distribuição de Dias Restantes */}
          {(selectedChart === "all" || selectedChart === "dias") && (
            <ChartCard
              title="Dias Restantes para Devolução"
              description="Distribuição por prazo de devolução"
              icon={Clock}
            >
              <ChartContainer config={chartConfig} className={`h-[${chartHeight}px]`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diasRestantesData} margin={barChartMargin}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="value" 
                      fill="hsl(var(--warning))" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </ChartCard>
          )}

          {/* Containers por Depot */}
          {(selectedChart === "all" || selectedChart === "depot") && (
            <ChartCard
              title="Containers por Depot de Devolução"
              description={`Top ${depotData.length} depots no período selecionado`}
              icon={Package}
              className={cn(selectedChart === "depot" && "lg:col-span-2")}
            >
              <ChartContainer config={chartConfig} className={`h-[${chartHeight}px]`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={depotData} margin={barChartMargin}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      angle={isMobile ? -45 : -30}
                      textAnchor="end"
                      height={isMobile ? 70 : 60}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 9 : 11 }}
                      interval={0}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </ChartCard>
          )}
          
          {/* Timeline de Operações */}
          {(selectedChart === "all" || selectedChart === "dias") && timelineData.length > 0 && (
            <ChartCard
              title="Timeline de Operações"
              description="Evolução de entradas e devoluções nos últimos meses"
              icon={Activity}
              className={cn(selectedChart === "dias" && "lg:col-span-2")}
            >
              <ChartContainer config={chartConfig} className={`h-[${chartHeight}px]`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="entradas" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="devolucoes" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--success))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </ChartCard>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}