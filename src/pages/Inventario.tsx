import { PackageOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Inventario() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Inventário</h1>
        <p className="text-muted-foreground mt-1">
          Gestão de itens e equipamentos relacionados aos containers.
        </p>
      </div>

      <Card className="border-l-4 border-l-secondary">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Em Desenvolvimento
          </CardTitle>
          <PackageOpen className="h-4 w-4 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-semibold text-foreground">
            Esta página será implementada em breve.
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Aqui você poderá gerenciar o inventário de peças e equipamentos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}