import { Container } from "@/types/container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Clock, Package, XCircle } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VencimentoAlertProps {
  containers: Container[];
  onFilterChange: (status: 'all' | 'vencidos' | 'proximos') => void;
  currentFilter: string;
}

export function VencimentoAlert({ containers, onFilterChange, currentFilter }: VencimentoAlertProps) {
  const { vencidos, proximos, totalAlerta } = useMemo(() => {
    let vencidos = 0;
    let proximos = 0; // 1 a 3 dias restantes

    containers.forEach(c => {
      const dias = typeof c.diasRestantes === 'number' ? c.diasRestantes : 0;
      
      if (dias === 0) {
        vencidos++;
      } else if (dias > 0 && dias <= 3) {
        proximos++;
      }
    });

    return {
      vencidos,
      proximos,
      totalAlerta: vencidos + proximos,
    };
  }, [containers]);

  if (totalAlerta === 0) {
    return null;
  }

  const isCritical = vencidos > 0;
  
  // Alert só suporta 'default' ou 'destructive'. Usamos 'destructive' para crítico e 'default' para aviso.
  const alertVariant = isCritical ? "destructive" : "default"; 
  
  const Icon = isCritical ? XCircle : AlertTriangle;
  const title = isCritical ? "ALERTA CRÍTICO: Containers Vencidos" : "AVISO: Containers Próximos do Vencimento";
  const description = isCritical 
    ? `Você tem ${vencidos} container(es) com Free Time expirado (0 dias restantes). Ação imediata é necessária.`
    : `Você tem ${proximos} container(es) com 1 a 3 dias restantes de Free Time. Planeje a devolução.`;

  // Classes customizadas para o alerta de warning (amarelo)
  const customClasses = !isCritical 
    ? "border-warning text-warning-foreground bg-warning/10 [&>svg]:text-warning-foreground" 
    : "";

  return (
    <Alert variant={alertVariant} className={cn("p-3 mb-4 border-l-4", customClasses)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", isCritical ? "text-destructive-foreground" : "text-warning")} />
        <div className="flex-1">
          <AlertTitle className="text-sm font-bold">{title}</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            {description}
          </AlertDescription>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
            {vencidos > 0 && (
                <Button 
                    variant={currentFilter === 'vencidos' ? 'default' : 'secondary'} 
                    size="sm" 
                    className="h-7 text-xs px-2 gap-1"
                    onClick={() => onFilterChange('vencidos')}
                >
                    <XCircle className="h-3 w-3" />
                    Ver Vencidos ({vencidos})
                </Button>
            )}
            {proximos > 0 && (
                <Button 
                    variant={currentFilter === 'proximos' ? 'default' : 'secondary'} 
                    size="sm" 
                    className="h-7 text-xs px-2 gap-1"
                    onClick={() => onFilterChange('proximos')}
                >
                    <Clock className="h-3 w-3" />
                    Ver Próximos ({proximos})
                </Button>
            )}
        </div>
      </div>
    </Alert>
  );
}