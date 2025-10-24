import { Container } from "@/types/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useMemo } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { TrendingUp, TrendingDown, Package, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface AnalisePageProps {
  containers: Container[];
}

export default function Analise({ containers }: AnalisePageProps) {
  const armadorData = useMemo(() => {
    const grouped = containers.reduce((acc, container) => {
      const armador = container.armador || "Não especificado";
      acc[armador] = (acc[armador] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [containers]);

  const depotData = useMemo(() => {
    const grouped = containers.reduce((acc, container) => {
      const depot = container.depotDevolucao || "Não especificado";
      if (depot && depot !== "-") {
        acc[depot] = (acc[depot] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [containers]);

  const statusData = useMemo(() => {
    const devolvidos = containers.filter(c => {
      const status = String(c.status || '').toLowerCase();
      return status.includes("ok") || status.includes("devolvido");
    }).length;
    const pendentes = containers.filter(c => {
      const status = String(c.status || '').toLowerCase();
      return status.includes("aguardando") || status.includes("verificar");
    }).length;
    const outros = containers.length - devolvidos - pendentes;

    return [
      { name: "Devolvidos", value: devolvidos },
      { name: "Pendentes", value: pendentes },
      { name: "Outros", value: outros },
    ].filter(item => item.value > 0);
  }, [containers]);

  const diasRestantesData = useMemo(() => {
    const ranges = {
      "Vencido": 0,
      "1-3 dias": 0,
      "4-7 dias": 0,
      "8-14 dias": 0,
      "15+ dias": 0,
    };

    containers.forEach(c => {
      const dias = typeof c.diasRestantes === 'number' ? c.diasRestantes : 0;
      if (dias <= 0) ranges["Vencido"]++;
      else if (dias <= 3) ranges["1-3 dias"]++;
      else if (dias <= 7) ranges["4-7 dias"]++;
      else if (dias <= 14) ranges["8-14 dias"]++;
      else ranges["15+ dias"]++;
    });

    return Object.entries(ranges).map(([name, value]) => ({ name, value }));
  }, [containers]);

  const chartConfig = {
    devolvidos: { label: "Devolvidos", color: "hsl(var(--chart-1))" },
    pendentes: { label: "Pendentes", color: "hsl(var(--chart-2))" },
    outros: { label: "Outros", color: "hsl(var(--chart-3))" },
    vencido: { label: "Vencido", color: "hsl(var(--destructive))" },
  };

  const devolvidos = statusData.find(s => s.name === "Devolvidos")?.value || 0;
  const pendentes = statusData.find(s => s.name === "Pendentes")?.value || 0;
  const vencidos = diasRestantesData.find(d => d.name === "Vencido")?.value || 0;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Análise de Dados</h1>
        <p className="text-muted-foreground text-lg">
          Visualização e estatísticas detalhadas dos containers CAS
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Containers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{containers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {armadorData.length} armadores distintos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devolvidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{devolvidos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {containers.length > 0 ? ((devolvidos / containers.length) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {containers.length > 0 ? ((pendentes / containers.length) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vencidos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {containers.length > 0 ? ((vencidos / containers.length) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Containers por Armador */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Containers por Armador</CardTitle>
            <CardDescription>Distribuição de containers entre os armadores</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={armadorData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Status */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Proporção de containers por status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === "Devolvidos" ? "hsl(var(--chart-1))" : 
                            entry.name === "Pendentes" ? "hsl(var(--chart-2))" : 
                            "hsl(var(--chart-3))"}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Dias Restantes */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Dias Restantes para Devolução</CardTitle>
            <CardDescription>Distribuição por prazo de devolução</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={diasRestantesData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--chart-2))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Containers por Depot */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Containers por Depot de Devolução</CardTitle>
            <CardDescription>Distribuição entre os depots</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={depotData} margin={{ top: 20, right: 20, bottom: 80, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
